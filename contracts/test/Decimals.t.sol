// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Fixtures} from "./Fixtures.sol";
import {Lading} from "../src/Lading.sol";

/// @dev FR-018. The Governor build lost ten days to exactly this: a shared converter
///      assumed 18 decimals against a 6-decimal token, every amount came out 1e12 too
///      small, and it failed SILENTLY — clean logs, healthy heartbeat, an agent doing
///      nothing. The live USDT on BOT Chain is 6 decimals.
///
///      The defence here is structural rather than careful: the contract never reads
///      `decimals()` and never rescales anything. These tests assert that on the token's
///      own ledger, not on an event, because an event can be as wrong as the transfer.
contract DecimalsTest is Fixtures {
    function test_sixDecimalFaceAmountArrivesExactlyAsIssued() public {
        assertEq(usdt.decimals(), 6, "fixture must mirror the live token");

        uint64 expiry = uint64(block.timestamp + 1 days);
        uint256 id = _openUsdt(FACE_USDT, expiry); // 12.500000 USDT

        assertEq(usdt.balanceOf(address(lading)), FACE_USDT, "escrow holds the exact base units");
        assertEq(lading.getCredit(id).faceAmount, FACE_USDT, "stored without rescaling");

        vm.prank(beneficiary);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        // 12_500_000 — not 12_500_000_000_000_000_000, and not 12
        assertEq(usdt.balanceOf(beneficiary), 12_500_000, "paid in the token's own base unit");
        assertEq(usdt.balanceOf(address(lading)), 0, "nothing stranded");
    }

    function test_sixDecimalRefundReturnsExactlyWhatWasFunded() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 before = usdt.balanceOf(applicant);
        uint256 id = _openUsdt(FACE_USDT, expiry);

        vm.warp(expiry + 1);
        lading.refund(id);

        assertEq(usdt.balanceOf(applicant), before, "applicant made whole to the base unit");
        assertEq(usdt.balanceOf(address(lading)), 0);
    }

    /// A 1e12 scaling error would be invisible at round numbers and enormous at the
    /// extremes. Fuzzing the face amount catches it at both ends.
    function testFuzz_anyFaceAmountRoundTripsExactly(uint256 face) public {
        face = bound(face, 1, 1_000_000_000);

        uint64 expiry = uint64(block.timestamp + 1 days);
        vm.startPrank(applicant);
        usdt.approve(address(lading), face);
        uint256 id = lading.openCredit(beneficiary, _presenters(), address(usdt), face, expiry, DOC, _spec());
        vm.stopPrank();

        assertEq(usdt.balanceOf(address(lading)), face);

        vm.prank(beneficiary);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        assertEq(usdt.balanceOf(beneficiary), face, "exact, at every magnitude");
    }

    function test_nativeCreditRejectsAccompanyingTokenConfusion() public {
        // A token-denominated credit must not also carry native value: the native would be
        // unreachable by every path and silently lost.
        vm.startPrank(applicant);
        usdt.approve(address(lading), FACE_USDT);
        vm.expectRevert(Lading.WrongValueSent.selector);
        lading.openCredit{value: 1 ether}(
            beneficiary, _presenters(), address(usdt), FACE_USDT, uint64(block.timestamp + 1 days), DOC, _spec()
        );
        vm.stopPrank();
    }
}
