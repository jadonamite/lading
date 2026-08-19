// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Lading} from "../src/Lading.sol";

/// @dev Shaped like the USDT actually live on BOT Chain mainnet
///      (0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C): **6 decimals**, standard
///      bool-returning ERC-20, no fee on transfer, no blacklist, no pause.
///      The decimals are the point — an 18-decimal assumption here fails silently.
contract MockUSDT {
    string public constant name = "Tether USD";
    string public constant symbol = "USDT";
    uint8 public constant decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @dev Refuses incoming native value. Used to prove a failed payout cannot silently
///      succeed and leave a credit marked Honoured with the money still inside.
contract RejectsNative {
    receive() external payable {
        revert("no");
    }
}

abstract contract Fixtures is Test {
    Lading internal lading;
    MockUSDT internal usdt;

    address internal applicant = makeAddr("applicant");
    address internal beneficiary = makeAddr("beneficiary");
    address internal stranger = makeAddr("stranger");
    address internal inspector = makeAddr("inspector");

    bytes32 internal constant DOC = keccak256("bill-of-lading-v1");
    bytes32 internal constant WRONG_DOC = keccak256("some-other-document");

    bytes32 internal constant K_QUANTITY = keccak256("quantity");
    bytes32 internal constant K_SHIPDATE = keccak256("latestShipmentDate");
    bytes32 internal constant K_CONSIGNEE = keccak256("consigneeId");

    /// 12.500000 USDT — deliberately not a round number, so a 1e12 scaling error cannot
    /// hide behind a value that happens to look plausible either way.
    uint256 internal constant FACE_USDT = 12_500_000;

    function setUp() public virtual {
        lading = new Lading();
        usdt = new MockUSDT();

        vm.deal(applicant, 100 ether);
        vm.deal(beneficiary, 1 ether);
        vm.deal(stranger, 1 ether);
        usdt.mint(applicant, 1_000_000_000); // 1,000 USDT
    }

    // ── builders ─────────────────────────────────────────────────────────────

    function _spec() internal pure returns (Lading.FieldSpec[] memory s) {
        s = new Lading.FieldSpec[](3);
        s[0] = Lading.FieldSpec({key: K_QUANTITY, op: Lading.Op.EQ, value: 500});
        s[1] = Lading.FieldSpec({key: K_SHIPDATE, op: Lading.Op.LTE, value: 1_755_000_000});
        s[2] = Lading.FieldSpec({key: K_CONSIGNEE, op: Lading.Op.EQ, value: 0xC0FFEE});
    }

    function _presenters() internal view returns (address[] memory p) {
        p = new address[](1);
        p[0] = beneficiary;
    }

    function _conformingKeys() internal pure returns (bytes32[] memory k) {
        k = new bytes32[](3);
        k[0] = K_QUANTITY;
        k[1] = K_SHIPDATE;
        k[2] = K_CONSIGNEE;
    }

    function _conformingValues() internal pure returns (uint256[] memory v) {
        v = new uint256[](3);
        v[0] = 500;
        v[1] = 1_754_000_000; // earlier than the bound — LTE passes
        v[2] = 0xC0FFEE;
    }

    /// A credit denominated in the native token.
    function _openNative(uint256 face, uint64 expiry) internal returns (uint256 id) {
        vm.prank(applicant);
        id = lading.openCredit{value: face}(
            beneficiary, _presenters(), address(0), face, expiry, DOC, _spec()
        );
    }

    /// A credit denominated in the 6-decimal USDT.
    function _openUsdt(uint256 face, uint64 expiry) internal returns (uint256 id) {
        vm.startPrank(applicant);
        usdt.approve(address(lading), face);
        id = lading.openCredit(beneficiary, _presenters(), address(usdt), face, expiry, DOC, _spec());
        vm.stopPrank();
    }
}
