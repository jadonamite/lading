// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title  Lading — a documentary credit, settled by contract
/// @notice A letter of credit: the applicant funds it, and the beneficiary is paid when
///         documents matching a pre-agreed specification are presented. If they never are,
///         the applicant is refunded at expiry.
///
///         The instrument is UCP 600 (ICC, in force 2007), which standardised the insight
///         that makes cross-border trade work at all: *the bank never verifies the goods.
///         It verifies paperwork against a spec.* That check is mechanical, which is why it
///         belongs in a contract; what needed the bank was custody, and custody is the one
///         thing a settlement layer provides for free.
///
/// @dev    THERE IS NO ADMINISTRATOR. No owner, no role, no pause, no upgrade path, no
///         `selfdestruct`, and no `receive`/`fallback`. Funded value leaves this contract
///         through exactly two paths — `present` when a presentation conforms, and `refund`
///         after expiry — and neither consults any address's discretion. That absence is the
///         product, and it is verifiable by reading this file on the explorer.
///
///         Amounts are held and moved in the asset's own base unit and are never rescaled.
///         The live USDT on this chain has 6 decimals, not 18.
contract Lading is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum State {
        None,
        Open,
        Honoured,
        Refunded
    }

    /// @notice How a presented field is tested against the credit's stated bound.
    /// @dev    A credit that can only test equality cannot express "latest shipment date on
    ///         or before the 22nd", which is what a real presentation is mostly made of.
    enum Op {
        EQ,
        LTE,
        GTE
    }

    /// @notice Why a presentation was refused. Under UCP 600 art. 16 a refusal must state
    ///         each discrepancy, so a refusal here carries its reason rather than reverting.
    enum Reason {
        None,
        DocumentHash,
        FieldMissing,
        FieldFailed
    }

    struct FieldSpec {
        bytes32 key; // keccak("quantity") — a label, matched as bytes, never parsed
        Op op;
        uint256 value; // the bound
    }

    struct Credit {
        address applicant; // funds it; refunded at expiry
        address beneficiary; // paid on honour
        address asset; // address(0) == the native token
        uint256 faceAmount; // the asset's own base unit — never rescaled
        uint64 expiry; // absolute; a conforming presentation after it is refused
        bytes32 docHash; // the document the presentation must match
        State state;
        uint32 amendmentSeq;
    }

    /// @notice A stored notice of refusal. Kept, not discarded: a refused presentation is
    ///         the normal case in trade finance, and both parties must be able to read why.
    struct Notice {
        address presenter;
        uint64 at;
        Reason reason;
        bytes32 field; // 0x0 when the document hash itself failed
        Op op;
        uint256 expected;
        uint256 presented;
    }

    /// @notice The result of examining a presentation against a credit's specification.
    ///         Returned as a struct so the same shape drives the contract, the gas-free
    ///         dry-run, and the refusal panel in the interface.
    struct Finding {
        bool ok;
        Reason reason;
        bytes32 field; // 0x0 when the document hash itself failed
        Op op;
        uint256 expected;
        uint256 presented;
    }

    /// @notice Terms superseded by an amendment, kept readable after the fact.
    struct Superseded {
        uint32 seq;
        uint64 expiry;
        bytes32 docHash;
        uint64 at;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public nextId = 1;

    mapping(uint256 => Credit) private _credits;
    mapping(uint256 => FieldSpec[]) private _specs;
    mapping(uint256 => Notice[]) private _notices;
    mapping(uint256 => Superseded[]) private _history;
    mapping(uint256 => mapping(address => bool)) private _nominated;

    /// @dev amendment hash => signer => signed
    mapping(uint256 => mapping(bytes32 => mapping(address => bool))) private _amendmentSigs;

    /// @dev A specification is bounded so that conformity can never run out of gas, which
    ///      would strand funded value until expiry.
    uint256 public constant MAX_FIELDS = 16;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event CreditOpened(
        uint256 indexed id,
        address indexed applicant,
        address indexed beneficiary,
        address asset,
        uint256 faceAmount,
        uint64 expiry,
        bytes32 docHash
    );
    event PresenterNominated(uint256 indexed id, address indexed presenter);
    event PresentationHonoured(uint256 indexed id, address indexed presenter, uint256 amount);
    event PresentationRefused(
        uint256 indexed id,
        address indexed presenter,
        Reason reason,
        bytes32 field,
        Op op,
        uint256 expected,
        uint256 presented
    );
    event CreditRefunded(uint256 indexed id, address indexed applicant, uint256 amount);
    event AmendmentSigned(uint256 indexed id, bytes32 indexed amendmentHash, address indexed signer);
    event AmendmentApplied(
        uint256 indexed id, uint32 seq, uint64 oldExpiry, uint64 newExpiry, bytes32 oldDocHash, bytes32 newDocHash
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error NoSuchCredit();
    error NotOpen();
    error Expired();
    error NotYetExpired();
    error NotNominated();
    error NotAParty();
    error BadTerms();
    error WrongValueSent();
    error UnexpectedTokenBalance();
    error LengthMismatch();
    error DuplicateField();
    error NativeTransferFailed();

    // ─────────────────────────────────────────────────────────────────────────
    // Issuance
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Open and fund a credit in one transaction. From this point the value is
    ///         unreachable except by honour or refund — including by the applicant.
    /// @param  asset address(0) for the native token, otherwise an ERC-20.
    /// @param  faceAmount in the asset's own base unit (USDT here is 6 decimals).
    function openCredit(
        address beneficiary,
        address[] calldata presenters,
        address asset,
        uint256 faceAmount,
        uint64 expiry,
        bytes32 docHash,
        FieldSpec[] calldata spec
    ) external payable nonReentrant returns (uint256 id) {
        if (beneficiary == address(0) || presenters.length == 0) revert BadTerms();
        if (faceAmount == 0 || expiry <= block.timestamp) revert BadTerms();
        if (spec.length > MAX_FIELDS) revert BadTerms();

        // Duplicate keys would make conformity ambiguous — the same field could both pass
        // and fail. Bounded at MAX_FIELDS, so the quadratic check is cheap and final.
        for (uint256 i = 0; i < spec.length; ++i) {
            for (uint256 j = i + 1; j < spec.length; ++j) {
                if (spec[i].key == spec[j].key) revert DuplicateField();
            }
        }

        id = nextId++;

        _credits[id] = Credit({
            applicant: msg.sender,
            beneficiary: beneficiary,
            asset: asset,
            faceAmount: faceAmount,
            expiry: expiry,
            docHash: docHash,
            state: State.Open,
            amendmentSeq: 0
        });

        for (uint256 i = 0; i < spec.length; ++i) {
            _specs[id].push(spec[i]);
        }
        for (uint256 i = 0; i < presenters.length; ++i) {
            if (presenters[i] == address(0)) revert BadTerms();
            _nominated[id][presenters[i]] = true;
            emit PresenterNominated(id, presenters[i]);
        }

        if (asset == address(0)) {
            if (msg.value != faceAmount) revert WrongValueSent();
        } else {
            if (msg.value != 0) revert WrongValueSent();
            // Measured, not assumed: a fee-on-transfer asset would leave the credit
            // underfunded and the shortfall would only surface at honour.
            uint256 before = IERC20(asset).balanceOf(address(this));
            IERC20(asset).safeTransferFrom(msg.sender, address(this), faceAmount);
            if (IERC20(asset).balanceOf(address(this)) - before != faceAmount) {
                revert UnexpectedTokenBalance();
            }
        }

        emit CreditOpened(id, msg.sender, beneficiary, asset, faceAmount, expiry, docHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Presentation
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Present documents against a credit.
    /// @dev    A non-conforming presentation does NOT revert. It records a notice of refusal
    ///         naming the failed condition and leaves the credit open, which is both what
    ///         FR-004 requires and what UCP 600 art. 16 requires of a bank. Reverting would
    ///         destroy the only record of why the presentation failed.
    ///
    ///         Presenting after expiry, or by an address that was never nominated, does
    ///         revert — those are not discrepancies in the documents, and allowing strangers
    ///         to write notices would let anyone spam a credit's record.
    /// @return honoured true if the credit was paid in this call.
    function present(uint256 id, bytes32 docHash, bytes32[] calldata keys, uint256[] calldata values)
        external
        nonReentrant
        returns (bool honoured)
    {
        Credit storage c = _credits[id];
        if (c.state == State.None) revert NoSuchCredit();
        if (c.state != State.Open) revert NotOpen();
        if (block.timestamp > c.expiry) revert Expired();
        if (!_nominated[id][msg.sender]) revert NotNominated();
        if (keys.length != values.length) revert LengthMismatch();

        Finding memory f = _examine(id, docHash, keys, values);

        if (!f.ok) {
            _notices[id].push(
                Notice({
                    presenter: msg.sender,
                    at: uint64(block.timestamp),
                    reason: f.reason,
                    field: f.field,
                    op: f.op,
                    expected: f.expected,
                    presented: f.presented
                })
            );
            emit PresentationRefused(id, msg.sender, f.reason, f.field, f.op, f.expected, f.presented);
            return false;
        }

        // Effects before interaction: the credit is settled before a single wei moves.
        c.state = State.Honoured;
        uint256 amount = c.faceAmount;
        emit PresentationHonoured(id, msg.sender, amount);
        _pay(c.asset, c.beneficiary, amount);
        return true;
    }

    /// @notice Test a presentation without spending gas on it, so a party can see the
    ///         discrepancy before deciding to submit.
    function conforms(uint256 id, bytes32 docHash, bytes32[] calldata keys, uint256[] calldata values)
        external
        view
        returns (Finding memory)
    {
        if (_credits[id].state == State.None) revert NoSuchCredit();
        if (keys.length != values.length) revert LengthMismatch();
        return _examine(id, docHash, keys, values);
    }

    /// @dev The whole instrument in one function: check the paperwork against the spec.
    ///      Returns the FIRST failing condition, in the order the applicant wrote them.
    function _examine(uint256 id, bytes32 docHash, bytes32[] calldata keys, uint256[] calldata values)
        private
        view
        returns (Finding memory)
    {
        Credit storage c = _credits[id];

        if (docHash != c.docHash) {
            return Finding({
                ok: false,
                reason: Reason.DocumentHash,
                field: bytes32(0),
                op: Op.EQ,
                expected: uint256(c.docHash),
                presented: uint256(docHash)
            });
        }

        FieldSpec[] storage spec = _specs[id];
        for (uint256 i = 0; i < spec.length; ++i) {
            FieldSpec storage f = spec[i];

            bool found;
            uint256 v;
            for (uint256 j = 0; j < keys.length; ++j) {
                if (keys[j] == f.key) {
                    found = true;
                    v = values[j];
                    break;
                }
            }
            if (!found) {
                return Finding({
                    ok: false,
                    reason: Reason.FieldMissing,
                    field: f.key,
                    op: f.op,
                    expected: f.value,
                    presented: 0
                });
            }

            bool pass = f.op == Op.EQ ? v == f.value : (f.op == Op.LTE ? v <= f.value : v >= f.value);
            if (!pass) {
                return Finding({
                    ok: false,
                    reason: Reason.FieldFailed,
                    field: f.key,
                    op: f.op,
                    expected: f.value,
                    presented: v
                });
            }
        }

        return Finding({ok: true, reason: Reason.None, field: bytes32(0), op: Op.EQ, expected: 0, presented: 0});
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Expiry
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Return the full funded balance to the applicant after an unhonoured expiry.
    /// @dev    Callable by anyone, because the funds can only ever route to the applicant.
    ///         That removes a liveness dependency on the applicant being online without
    ///         granting anybody a choice about where the money goes.
    function refund(uint256 id) external nonReentrant {
        Credit storage c = _credits[id];
        if (c.state == State.None) revert NoSuchCredit();
        if (c.state != State.Open) revert NotOpen();
        if (block.timestamp <= c.expiry) revert NotYetExpired();

        c.state = State.Refunded;
        uint256 amount = c.faceAmount;
        emit CreditRefunded(id, c.applicant, amount);
        _pay(c.asset, c.applicant, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Amendment (UCP 600 art. 10 — nobody amends alone)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Sign an amendment to an open credit's expiry and required document.
    /// @dev    Applies only once BOTH applicant and beneficiary have signed the identical
    ///         terms. One party's signature changes nothing, which is the entire point of an
    ///         amendment under art. 10. The hash is bound to this chain, this contract, this
    ///         credit and this sequence number, so a signature cannot be replayed elsewhere.
    function signAmendment(uint256 id, uint64 newExpiry, bytes32 newDocHash) external returns (bool applied) {
        Credit storage c = _credits[id];
        if (c.state == State.None) revert NoSuchCredit();
        if (c.state != State.Open) revert NotOpen();
        if (msg.sender != c.applicant && msg.sender != c.beneficiary) revert NotAParty();
        if (newExpiry <= block.timestamp) revert BadTerms();

        bytes32 h = amendmentHash(id, newExpiry, newDocHash);
        _amendmentSigs[id][h][msg.sender] = true;
        emit AmendmentSigned(id, h, msg.sender);

        if (!(_amendmentSigs[id][h][c.applicant] && _amendmentSigs[id][h][c.beneficiary])) {
            return false;
        }

        _history[id].push(
            Superseded({seq: c.amendmentSeq, expiry: c.expiry, docHash: c.docHash, at: uint64(block.timestamp)})
        );

        emit AmendmentApplied(id, c.amendmentSeq + 1, c.expiry, newExpiry, c.docHash, newDocHash);
        c.expiry = newExpiry;
        c.docHash = newDocHash;
        c.amendmentSeq += 1;
        return true;
    }

    function amendmentHash(uint256 id, uint64 newExpiry, bytes32 newDocHash) public view returns (bytes32) {
        return keccak256(
            abi.encode(block.chainid, address(this), id, _credits[id].amendmentSeq, newExpiry, newDocHash)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────

    function getCredit(uint256 id) external view returns (Credit memory) {
        if (_credits[id].state == State.None) revert NoSuchCredit();
        return _credits[id];
    }

    function getSpec(uint256 id) external view returns (FieldSpec[] memory) {
        return _specs[id];
    }

    function getNotices(uint256 id) external view returns (Notice[] memory) {
        return _notices[id];
    }

    function getHistory(uint256 id) external view returns (Superseded[] memory) {
        return _history[id];
    }

    function isNominated(uint256 id, address who) external view returns (bool) {
        return _nominated[id][who];
    }

    function hasSigned(uint256 id, bytes32 h, address who) external view returns (bool) {
        return _amendmentSigs[id][h][who];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────────────────────

    function _pay(address asset, address to, uint256 amount) private {
        if (asset == address(0)) {
            (bool sent,) = payable(to).call{value: amount}("");
            if (!sent) revert NativeTransferFailed();
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }
    }

    // No receive(), no fallback(): native value sent outside `openCredit` would be
    // unreachable by any path in this contract, so it is refused at the door.
}
