// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Fixtures} from "./Fixtures.sol";
import {Lading} from "../src/Lading.sol";

/// @dev One test per acceptance scenario in specs/lading/spec.md → Slice 1.
contract LadingS1Test is Fixtures {
    // Slice 1, acceptance 1 —
    // Given a funded credit with spec S and expiry T, When the nominated presenter presents
    // a document conforming to S before T, Then the full face amount transfers to the
    // beneficiary in that same transaction and the credit is marked honoured.
    function test_S1_1_conformingPresentationPaysInTheSameTransaction() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));
        uint256 before = beneficiary.balance;

        vm.prank(beneficiary);
        bool honoured = lading.present(id, DOC, _conformingKeys(), _conformingValues());

        assertTrue(honoured, "should honour");
        assertEq(beneficiary.balance - before, 1 ether, "beneficiary paid in full");
        assertEq(address(lading).balance, 0, "contract retains nothing");
        assertEq(uint8(lading.getCredit(id).state), uint8(Lading.State.Honoured));
    }

    // Slice 1, acceptance 2 —
    // Given the same credit, When a document not conforming to S is presented, Then no funds
    // move, the credit stays open, and the rejection names the discrepancy.
    function test_S1_2_nonConformingPresentationMovesNothingAndNamesTheDiscrepancy() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        bytes32[] memory k = _conformingKeys();
        uint256[] memory v = _conformingValues();
        v[1] = 1_755_000_001; // one second past the latest shipment date

        vm.prank(beneficiary);
        bool honoured = lading.present(id, DOC, k, v);

        assertFalse(honoured);
        assertEq(beneficiary.balance, 1 ether, "beneficiary unpaid");
        assertEq(address(lading).balance, 1 ether, "funds unmoved");
        assertEq(uint8(lading.getCredit(id).state), uint8(Lading.State.Open), "credit stays open");

        Lading.Notice[] memory n = lading.getNotices(id);
        assertEq(n.length, 1);
        assertEq(uint8(n[0].reason), uint8(Lading.Reason.FieldFailed));
        assertEq(n[0].field, K_SHIPDATE, "names WHICH field failed");
        assertEq(n[0].expected, 1_755_000_000);
        assertEq(n[0].presented, 1_755_000_001);
    }

    function test_S1_2b_missingFieldIsNamedAsMissing() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        bytes32[] memory k = new bytes32[](2);
        uint256[] memory v = new uint256[](2);
        k[0] = K_QUANTITY;
        v[0] = 500;
        k[1] = K_SHIPDATE;
        v[1] = 1_754_000_000;

        vm.prank(beneficiary);
        lading.present(id, DOC, k, v);

        Lading.Notice[] memory n = lading.getNotices(id);
        assertEq(uint8(n[0].reason), uint8(Lading.Reason.FieldMissing));
        assertEq(n[0].field, K_CONSIGNEE);
    }

    function test_S1_2c_wrongDocumentHashIsNamedAsTheDocument() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        vm.prank(beneficiary);
        lading.present(id, WRONG_DOC, _conformingKeys(), _conformingValues());

        Lading.Notice[] memory n = lading.getNotices(id);
        assertEq(uint8(n[0].reason), uint8(Lading.Reason.DocumentHash));
        assertEq(address(lading).balance, 1 ether);
    }

    // Slice 1, acceptance 3 —
    // Given a funded credit, When anyone other than the nominated presenter presents a
    // perfectly conforming document, Then the presentation is refused.
    function test_S1_3_strangerCannotPresentEvenWithAPerfectDocument() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        vm.prank(stranger);
        vm.expectRevert(Lading.NotNominated.selector);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        assertEq(address(lading).balance, 1 ether);
    }

    // Slice 1, acceptance 4 —
    // Given a funded credit whose expiry T has passed with no honoured presentation, When
    // the applicant claims the refund, Then the full funded balance returns to the applicant.
    function test_S1_4_lapsedCreditRefundsInFull() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);
        uint256 before = applicant.balance;

        vm.warp(expiry + 1);
        vm.prank(applicant);
        lading.refund(id);

        assertEq(applicant.balance - before, 1 ether, "refunded in full");
        assertEq(address(lading).balance, 0);
        assertEq(uint8(lading.getCredit(id).state), uint8(Lading.State.Refunded));
    }

    function test_S1_4b_refundBeforeExpiryIsImpossibleForAnyone() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);

        vm.prank(applicant);
        vm.expectRevert(Lading.NotYetExpired.selector);
        lading.refund(id);

        vm.prank(stranger);
        vm.expectRevert(Lading.NotYetExpired.selector);
        lading.refund(id);
    }

    function test_S1_4c_anyoneMayTriggerARefundButOnlyTheApplicantIsPaid() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);
        uint256 beforeApplicant = applicant.balance;
        uint256 beforeStranger = stranger.balance;

        vm.warp(expiry + 1);
        vm.prank(stranger);
        lading.refund(id);

        assertEq(applicant.balance - beforeApplicant, 1 ether);
        assertEq(stranger.balance, beforeStranger, "the trigger gains nothing");
    }

    // Slice 1, acceptance 5 —
    // Given a funded credit whose expiry T has passed, When a conforming document is
    // presented after T, Then it is refused — expiry is absolute.
    function test_S1_5_expiryIsAbsolute() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);

        vm.warp(expiry + 1);
        vm.prank(beneficiary);
        vm.expectRevert(Lading.Expired.selector);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());
    }

    function test_S1_5b_presentationExactlyAtExpiryStillConforms() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);

        vm.warp(expiry);
        vm.prank(beneficiary);
        assertTrue(lading.present(id, DOC, _conformingKeys(), _conformingValues()));
    }

    // Slice 1, acceptance 6 —
    // Given an honoured credit, When the identical conforming presentation is submitted
    // again, Then it is refused and no second payment occurs.
    function test_S1_6_honouredCreditCannotBePaidTwice() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        vm.startPrank(beneficiary);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        vm.expectRevert(Lading.NotOpen.selector);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());
        vm.stopPrank();

        assertEq(address(lading).balance, 0);
    }

    function test_S1_6b_honouredCreditCannotThenBeRefunded() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        uint256 id = _openNative(1 ether, expiry);

        vm.prank(beneficiary);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        vm.warp(expiry + 1);
        vm.expectRevert(Lading.NotOpen.selector);
        lading.refund(id);
    }

    // ── the gas-free dry run the interface uses ──────────────────────────────

    function test_conformsDryRunMatchesTheRealOutcomeWithoutChangingState() public {
        uint256 id = _openNative(1 ether, uint64(block.timestamp + 1 days));

        bytes32[] memory k = _conformingKeys();
        uint256[] memory v = _conformingValues();
        v[0] = 499;

        Lading.Finding memory f = lading.conforms(id, DOC, k, v);
        assertFalse(f.ok);
        assertEq(f.field, K_QUANTITY);
        assertEq(f.expected, 500);
        assertEq(f.presented, 499);
        assertEq(lading.getNotices(id).length, 0, "a dry run leaves no record");

        Lading.Finding memory g = lading.conforms(id, DOC, _conformingKeys(), _conformingValues());
        assertTrue(g.ok);
    }

    // ── issuance terms ───────────────────────────────────────────────────────

    function test_openCreditRejectsMalformedTerms() public {
        uint64 ok = uint64(block.timestamp + 1 days);
        Lading.FieldSpec[] memory s = _spec();

        vm.startPrank(applicant);

        vm.expectRevert(Lading.BadTerms.selector);
        lading.openCredit{value: 1 ether}(address(0), _presenters(), address(0), 1 ether, ok, DOC, s);

        vm.expectRevert(Lading.BadTerms.selector);
        lading.openCredit{value: 1 ether}(beneficiary, new address[](0), address(0), 1 ether, ok, DOC, s);

        vm.expectRevert(Lading.BadTerms.selector);
        lading.openCredit{value: 0}(beneficiary, _presenters(), address(0), 0, ok, DOC, s);

        // an expiry in the past would open a credit that is refundable on arrival
        vm.expectRevert(Lading.BadTerms.selector);
        lading.openCredit{value: 1 ether}(
            beneficiary, _presenters(), address(0), 1 ether, uint64(block.timestamp), DOC, s
        );

        vm.expectRevert(Lading.WrongValueSent.selector);
        lading.openCredit{value: 0.5 ether}(beneficiary, _presenters(), address(0), 1 ether, ok, DOC, s);

        vm.stopPrank();
    }

    function test_duplicateFieldKeysAreRejectedAtIssuance() public {
        Lading.FieldSpec[] memory s = new Lading.FieldSpec[](2);
        s[0] = Lading.FieldSpec({key: K_QUANTITY, op: Lading.Op.GTE, value: 100});
        s[1] = Lading.FieldSpec({key: K_QUANTITY, op: Lading.Op.LTE, value: 50});

        vm.prank(applicant);
        vm.expectRevert(Lading.DuplicateField.selector);
        lading.openCredit{value: 1 ether}(
            beneficiary, _presenters(), address(0), 1 ether, uint64(block.timestamp + 1 days), DOC, s
        );
    }

    function test_allThreeOperatorsBehave() public {
        Lading.FieldSpec[] memory s = new Lading.FieldSpec[](3);
        s[0] = Lading.FieldSpec({key: keccak256("eq"), op: Lading.Op.EQ, value: 10});
        s[1] = Lading.FieldSpec({key: keccak256("lte"), op: Lading.Op.LTE, value: 10});
        s[2] = Lading.FieldSpec({key: keccak256("gte"), op: Lading.Op.GTE, value: 10});

        vm.prank(applicant);
        uint256 id = lading.openCredit{value: 1 ether}(
            beneficiary, _presenters(), address(0), 1 ether, uint64(block.timestamp + 1 days), DOC, s
        );

        bytes32[] memory k = new bytes32[](3);
        k[0] = keccak256("eq");
        k[1] = keccak256("lte");
        k[2] = keccak256("gte");

        uint256[] memory v = new uint256[](3);
        v[0] = 10;
        v[1] = 9; // under the ceiling
        v[2] = 11; // over the floor
        assertTrue(lading.conforms(id, DOC, k, v).ok);

        v[1] = 11; // over the ceiling
        assertFalse(lading.conforms(id, DOC, k, v).ok);

        v[1] = 10; // exactly at the ceiling — inclusive
        v[2] = 10; // exactly at the floor — inclusive
        assertTrue(lading.conforms(id, DOC, k, v).ok);

        v[2] = 9;
        assertFalse(lading.conforms(id, DOC, k, v).ok);
    }

    function test_creditWithNoFieldsIsAPureDocumentaryCredit() public {
        vm.prank(applicant);
        uint256 id = lading.openCredit{value: 1 ether}(
            beneficiary,
            _presenters(),
            address(0),
            1 ether,
            uint64(block.timestamp + 1 days),
            DOC,
            new Lading.FieldSpec[](0)
        );

        vm.prank(beneficiary);
        assertTrue(lading.present(id, DOC, new bytes32[](0), new uint256[](0)));
    }

    function test_unknownCreditIsNotSilentlyEmpty() public {
        vm.expectRevert(Lading.NoSuchCredit.selector);
        lading.getCredit(999);

        vm.expectRevert(Lading.NoSuchCredit.selector);
        lading.refund(999);
    }
}
