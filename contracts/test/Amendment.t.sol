// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Fixtures} from "./Fixtures.sol";
import {Lading} from "../src/Lading.sol";

/// @dev Slice 2. UCP 600 art. 10: a credit can be neither amended nor cancelled without the
///      agreement of the issuer, the confirming bank and the beneficiary. Here the parties
///      are two, and the rule reduces to the thing that matters — nobody moves the terms
///      alone. Every test below exists to hold one half of that sentence.
contract AmendmentTest is Fixtures {
    uint64 internal expiry;

    function setUp() public override {
        super.setUp();
        expiry = uint64(block.timestamp + 1 days);
    }

    // Slice 2, acceptance 2 — one signature changes nothing.
    function test_oneSignatureAloneChangesNothing() public {
        uint256 id = _openNative(1 ether, expiry);
        uint64 newExpiry = expiry + 7 days;

        vm.prank(applicant);
        bool applied = lading.signAmendment(id, newExpiry, DOC);

        assertFalse(applied, "must not apply on one signature");
        assertEq(lading.getCredit(id).expiry, expiry, "terms unmoved");
        assertEq(lading.getCredit(id).amendmentSeq, 0, "sequence unmoved");
        assertEq(lading.getHistory(id).length, 0, "nothing superseded");
    }

    // The mirror of the above: the beneficiary alone is equally powerless.
    function test_theBeneficiaryAloneIsEquallyPowerless() public {
        uint256 id = _openNative(1 ether, expiry);

        vm.prank(beneficiary);
        bool applied = lading.signAmendment(id, expiry + 7 days, WRONG_DOC);

        assertFalse(applied);
        assertEq(lading.getCredit(id).docHash, DOC, "document requirement unmoved");
    }

    // Slice 2, acceptance 3 — both signatures on identical terms apply them.
    function test_bothSignaturesOnIdenticalTermsApplyThem() public {
        uint256 id = _openNative(1 ether, expiry);
        uint64 newExpiry = expiry + 7 days;

        vm.prank(applicant);
        lading.signAmendment(id, newExpiry, WRONG_DOC);
        vm.prank(beneficiary);
        bool applied = lading.signAmendment(id, newExpiry, WRONG_DOC);

        assertTrue(applied, "second signature applies the amendment");
        Lading.Credit memory c = lading.getCredit(id);
        assertEq(c.expiry, newExpiry, "expiry extended");
        assertEq(c.docHash, WRONG_DOC, "required document replaced");
        assertEq(c.amendmentSeq, 1, "sequence bumped");
    }

    // Signing *different* terms is not agreement, however close the terms look.
    function test_signaturesOnDifferentTermsAreNotAgreement() public {
        uint256 id = _openNative(1 ether, expiry);

        vm.prank(applicant);
        lading.signAmendment(id, expiry + 7 days, DOC);
        vm.prank(beneficiary);
        bool applied = lading.signAmendment(id, expiry + 7 days + 1, DOC);

        assertFalse(applied, "one second apart is not the same amendment");
        assertEq(lading.getCredit(id).expiry, expiry, "terms unmoved");
    }

    // Slice 2, acceptance 3 — the superseded terms stay readable after the fact. A credit
    // that quietly forgets what it used to require is not evidence of anything.
    function test_supersededTermsStayReadable() public {
        uint256 id = _openNative(1 ether, expiry);
        uint64 newExpiry = expiry + 7 days;

        vm.prank(applicant);
        lading.signAmendment(id, newExpiry, WRONG_DOC);
        vm.prank(beneficiary);
        lading.signAmendment(id, newExpiry, WRONG_DOC);

        Lading.Superseded[] memory h = lading.getHistory(id);
        assertEq(h.length, 1, "one superseded term set");
        assertEq(h[0].seq, 0, "the sequence it replaced");
        assertEq(h[0].expiry, expiry, "the expiry it replaced");
        assertEq(h[0].docHash, DOC, "the document it replaced");
        assertEq(h[0].at, uint64(block.timestamp), "when it was replaced");
    }

    // The whole point of Slice 2: refused → amend → present again → paid.
    function test_theRefusedPresentationPathEndsInPayment() public {
        uint256 id = _openNative(1 ether, expiry);
        bytes32 REVISED = keccak256("bill-of-lading-v2");

        // The document presented is the revised one; the credit still calls for v1.
        vm.prank(beneficiary);
        assertFalse(lading.present(id, REVISED, _conformingKeys(), _conformingValues()));
        Lading.Notice[] memory n = lading.getNotices(id);
        assertEq(n.length, 1, "the refusal is on the record");
        assertEq(uint8(n[0].reason), uint8(Lading.Reason.DocumentHash));

        // Both parties agree the revised document is the one that counts.
        vm.prank(applicant);
        lading.signAmendment(id, expiry, REVISED);
        vm.prank(beneficiary);
        assertTrue(lading.signAmendment(id, expiry, REVISED));

        uint256 before = beneficiary.balance;
        vm.prank(beneficiary);
        assertTrue(lading.present(id, REVISED, _conformingKeys(), _conformingValues()));
        assertEq(beneficiary.balance - before, 1 ether, "paid on the amended terms");
    }

    // An amendment moves the terms; it does not move the money, and it does not open a path
    // for the applicant to reach the escrow. FR-002 has to survive Slice 2 intact.
    function test_amendingMovesNoMoney() public {
        uint256 id = _openUsdt(FACE_USDT, expiry);
        uint256 escrow = usdt.balanceOf(address(lading));
        uint256 applicantBefore = usdt.balanceOf(applicant);

        vm.prank(applicant);
        lading.signAmendment(id, expiry + 30 days, WRONG_DOC);
        vm.prank(beneficiary);
        lading.signAmendment(id, expiry + 30 days, WRONG_DOC);

        assertEq(usdt.balanceOf(address(lading)), escrow, "escrow untouched");
        assertEq(usdt.balanceOf(applicant), applicantBefore, "applicant no richer");
        assertEq(lading.getCredit(id).faceAmount, FACE_USDT, "face amount is not amendable");
    }

    // A stranger has no standing, and the presenter's nomination confers none either.
    function test_aStrangerCannotSignAnAmendment() public {
        uint256 id = _openNative(1 ether, expiry);

        vm.expectRevert(Lading.NotAParty.selector);
        vm.prank(stranger);
        lading.signAmendment(id, expiry + 1 days, DOC);
    }

    // Expiry cannot be amended into the past — that would strand the credit in a state where
    // it can neither be honoured nor refunded until someone notices.
    function test_expiryCannotBeAmendedIntoThePast() public {
        uint256 id = _openNative(1 ether, expiry);

        vm.expectRevert(Lading.BadTerms.selector);
        vm.prank(applicant);
        lading.signAmendment(id, uint64(block.timestamp - 1), DOC);
    }

    // A settled credit is finished. Neither party may reopen the terms of a paid instrument.
    function test_aSettledCreditCannotBeAmended() public {
        uint256 id = _openNative(1 ether, expiry);
        vm.prank(beneficiary);
        lading.present(id, DOC, _conformingKeys(), _conformingValues());

        vm.expectRevert(Lading.NotOpen.selector);
        vm.prank(applicant);
        lading.signAmendment(id, expiry + 1 days, DOC);
    }

    // A signature is bound to the credit's current sequence number, so consent given to
    // amendment #1 cannot be harvested to pass amendment #2. Here the applicant signs the
    // *same* expiry and document twice across an amendment boundary and it does not apply.
    function test_consentDoesNotCarryAcrossAmendments() public {
        uint256 id = _openNative(1 ether, expiry);
        uint64 target = expiry + 14 days;

        // The applicant signs the target terms while the credit is at seq 0.
        vm.prank(applicant);
        lading.signAmendment(id, target, DOC);

        // An unrelated amendment both parties do agree on moves the credit to seq 1.
        vm.prank(applicant);
        lading.signAmendment(id, expiry + 1 days, DOC);
        vm.prank(beneficiary);
        assertTrue(lading.signAmendment(id, expiry + 1 days, DOC));

        // The beneficiary now signs the original target. The applicant's stale signature was
        // for a different sequence number and must not complete it.
        vm.prank(beneficiary);
        bool applied = lading.signAmendment(id, target, DOC);

        assertFalse(applied, "consent at seq 0 must not apply at seq 1");
        assertEq(lading.getCredit(id).expiry, expiry + 1 days, "terms are the agreed ones");
    }

    // The amendment hash is bound to this chain and this contract, so a signature cannot be
    // replayed against a second deployment of the same code.
    function test_theAmendmentHashIsBoundToThisDeployment() public {
        uint256 id = _openNative(1 ether, expiry);
        Lading other = new Lading();

        vm.prank(applicant);
        uint256 otherId = other.openCredit{value: 1 ether}(
            beneficiary, _presenters(), address(0), 1 ether, expiry, DOC, _spec()
        );

        assertEq(id, otherId, "same id on both deployments");
        assertTrue(
            lading.amendmentHash(id, expiry + 1 days, DOC) != other.amendmentHash(otherId, expiry + 1 days, DOC),
            "identical terms must not hash alike across deployments"
        );
    }
}
