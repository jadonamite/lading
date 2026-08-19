// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Fixtures, RejectsNative} from "./Fixtures.sol";
import {Lading} from "../src/Lading.sol";

/// @dev A beneficiary that re-enters `present` from its `receive` hook, trying to be paid
///      twice out of one credit.
contract ReentrantBeneficiary {
    Lading private immutable LADING;
    uint256 private immutable ID;
    bytes32 private immutable DOC_HASH;
    bool public reentered;
    bool public reentryReverted;

    constructor(Lading l, bytes32 d) {
        LADING = l;
        DOC_HASH = d;
        ID = 0;
    }

    function attack(uint256 id, bytes32[] calldata keys, uint256[] calldata values) external {
        _id = id;
        _keys = keys;
        _values = values;
        LADING.present(id, DOC_HASH, keys, values);
    }

    uint256 private _id;
    bytes32[] private _keys;
    uint256[] private _values;

    receive() external payable {
        if (reentered) return;
        reentered = true;
        try LADING.present(_id, DOC_HASH, _keys, _values) {
            reentryReverted = false;
        } catch {
            reentryReverted = true;
        }
    }
}

contract AttacksTest is Fixtures {
    // FR-007 — reentrancy must not extract a second payment.
    function test_reentrantBeneficiaryCannotBePaidTwice() public {
        ReentrantBeneficiary attacker = new ReentrantBeneficiary(lading, DOC);

        address[] memory presenters = new address[](1);
        presenters[0] = address(attacker);

        vm.prank(applicant);
        uint256 id = lading.openCredit{value: 1 ether}(
            address(attacker), presenters, address(0), 1 ether, uint64(block.timestamp + 1 days), DOC, _spec()
        );

        attacker.attack(id, _conformingKeys(), _conformingValues());

        assertTrue(attacker.reentered(), "the hook must actually have fired");
        assertTrue(attacker.reentryReverted(), "the re-entrant call must revert");
        assertEq(address(attacker).balance, 1 ether, "paid exactly once");
        assertEq(address(lading).balance, 0);
    }

    // FR-008 — a presentation is bound to one credit. Satisfying credit A never settles B.
    function test_presentationCannotSettleADifferentCredit() public {
        uint64 expiry = uint64(block.timestamp + 1 days);
        uint256 a = _openNative(1 ether, expiry);
        uint256 b = _openNative(2 ether, expiry);

        vm.prank(beneficiary);
        lading.present(a, DOC, _conformingKeys(), _conformingValues());

        assertEq(uint8(lading.getCredit(a).state), uint8(Lading.State.Honoured));
        assertEq(uint8(lading.getCredit(b).state), uint8(Lading.State.Open), "B untouched");
        assertEq(address(lading).balance, 2 ether, "B's funds still escrowed");
    }

    // A nomination on one credit confers nothing on another.
    function test_nominationDoesNotLeakBetweenCredits() public {
        uint64 expiry = uint64(block.timestamp + 1 days);
        _openNative(1 ether, expiry); // beneficiary nominated here

        address[] memory only = new address[](1);
        only[0] = inspector;
        vm.prank(applicant);
        uint256 b =
            lading.openCredit{value: 1 ether}(beneficiary, only, address(0), 1 ether, expiry, DOC, _spec());

        vm.prank(beneficiary);
        vm.expectRevert(Lading.NotNominated.selector);
        lading.present(b, DOC, _conformingKeys(), _conformingValues());
    }

    // A presentation array longer than the spec is fine — extra documents are ignored, as a
    // bank ignores documents the credit did not call for (UCP 600 art. 14g).
    function test_extraFieldsAreIgnoredNotTreatedAsDiscrepancies() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        bytes32[] memory k = new bytes32[](4);
        uint256[] memory v = new uint256[](4);
        k[0] = keccak256("unrelated");
        v[0] = 999;
        k[1] = K_QUANTITY;
        v[1] = 500;
        k[2] = K_SHIPDATE;
        v[2] = 1_754_000_000;
        k[3] = K_CONSIGNEE;
        v[3] = 0xC0FFEE;

        vm.prank(beneficiary);
        assertTrue(lading.present(id, DOC, k, v));
    }

    function test_mismatchedKeyAndValueLengthsAreRejected() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        vm.prank(beneficiary);
        vm.expectRevert(Lading.LengthMismatch.selector);
        lading.present(id, DOC, _conformingKeys(), new uint256[](2));
    }

    // A beneficiary that cannot receive native value must not leave the credit marked
    // Honoured with the money still inside. The whole call reverts; the credit stays open.
    function test_failedNativePayoutRevertsTheWholeHonour() public {
        RejectsNative rejector = new RejectsNative();

        address[] memory presenters = new address[](1);
        presenters[0] = address(rejector);

        vm.prank(applicant);
        uint256 id = lading.openCredit{value: 1 ether}(
            address(rejector), presenters, address(0), 1 ether, uint64(block.timestamp + 1 days), DOC, _spec()
        );

        vm.prank(address(rejector));
        vm.expectRevert(Lading.NativeTransferFailed.selector);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        assertEq(uint8(lading.getCredit(id).state), uint8(Lading.State.Open), "not falsely honoured");
        assertEq(address(lading).balance, 1 ether, "funds still escrowed and still refundable");
    }

    // Refused presentations accumulate as a record; they never settle anything.
    function test_manyRefusalsNeverSettleTheCredit() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        for (uint256 i = 0; i < 5; ++i) {
            vm.prank(beneficiary);
            lading.present(id, WRONG_DOC, _conformingKeys(), _conformingValues());
        }

        assertEq(lading.getNotices(id).length, 5, "every refusal is on the record");
        assertEq(address(lading).balance, 1 ether);
        assertEq(uint8(lading.getCredit(id).state), uint8(Lading.State.Open));
    }
}
