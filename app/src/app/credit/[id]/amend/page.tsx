"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { useAmendmentHash, useCredit, useHasSigned } from "@/lib/hooks";
import { asDate, hashDocument, shortAddr, State } from "@/lib/lading";
import { Button, Card, Empty, Ext, Field, Input } from "@/components/ui";

export default function AmendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address, isConnected } = useAccount();

  const { data: credit } = useCredit(id);
  const [expiry, setExpiry] = useState("");
  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");

  const newExpiry = useMemo(() => {
    if (!expiry) return credit?.expiry;
    const t = Math.floor(new Date(expiry).getTime() / 1000);
    return Number.isFinite(t) ? BigInt(t) : credit?.expiry;
  }, [expiry, credit?.expiry]);

  const newDoc = (docHash || credit?.docHash) as `0x${string}` | undefined;

  const { data: hashOfTerms } = useAmendmentHash(id, newExpiry, newDoc);
  const { data: applicantSigned } = useHasSigned(id, hashOfTerms, credit?.applicant);
  const { data: beneficiarySigned } = useHasSigned(id, hashOfTerms, credit?.beneficiary);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: sent } = useWaitForTransactionReceipt({ hash });

  if (id === undefined) return <Empty>That is not a credit number.</Empty>;
  if (!credit) return <Empty>Reading the chain…</Empty>;
  if (Number(credit.state) !== State.Open) {
    return (
      <Empty>
        A settled credit cannot be amended.{" "}
        <Link className="underline" href={`/credit/${idParam}`}>
          Back to the credit
        </Link>
      </Empty>
    );
  }

  const isApplicant = address?.toLowerCase() === credit.applicant.toLowerCase();
  const isBeneficiary = address?.toLowerCase() === credit.beneficiary.toLowerCase();
  const isParty = isApplicant || isBeneficiary;
  const youSigned = isApplicant ? applicantSigned : isBeneficiary ? beneficiarySigned : false;
  const bothSigned = applicantSigned && beneficiarySigned;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/credit/${idParam}`} className="text-sm text-ink-3 hover:text-ink">
          ← credit #{idParam}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Amend the terms</h1>
        <p className="mt-2 text-sm text-ink-2">
          Under UCP 600 art. 10 nobody amends a credit alone. Your signature does nothing until
          the other party signs the <em>identical</em> terms — and the moment they do, the
          amendment applies itself. The face amount is not amendable; that would be a different
          undertaking.
        </p>
      </div>

      <Card className="space-y-5">
        <Field
          label="New expiry"
          hint={`currently ${asDate(credit.expiry)} — leave blank to keep it`}
        >
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>

        <Field label="New required document" hint="leave blank to keep the document already agreed">
          <input
            type="file"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-rule file:bg-white file:px-3 file:py-1.5 file:text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setDocName(f.name);
              setDocHash(await hashDocument(f));
            }}
          />
          <p className="mono mt-2 truncate text-xs text-ink-3">
            {docHash ? `${docName} → ${docHash}` : credit.docHash}
          </p>
        </Field>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Consent</h2>
        <Signature
          who="Applicant"
          addr={credit.applicant}
          signed={!!applicantSigned}
          you={!!isApplicant}
        />
        <Signature
          who="Beneficiary"
          addr={credit.beneficiary}
          signed={!!beneficiarySigned}
          you={!!isBeneficiary}
        />
        {hashOfTerms ? (
          <p className="mono mt-3 truncate text-xs text-ink-3" title={hashOfTerms}>
            these terms: {hashOfTerms.slice(0, 26)}…
          </p>
        ) : null}
        <p className="mt-2 text-xs text-ink-3">
          A signature is bound to this chain, this contract, this credit and its current
          amendment number — so it cannot be replayed anywhere, or reused on the next amendment.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!isConnected || !isParty || isPending || mining || !newExpiry || !newDoc}
          onClick={() =>
            writeContract({
              address: LADING_ADDRESS,
              abi: ladingAbi,
              functionName: "signAmendment",
              args: [id, newExpiry!, newDoc!],
            })
          }
        >
          {isPending ? "Confirm in wallet…" : mining ? "Signing…" : "Sign these terms"}
        </Button>
        {!isParty && isConnected ? (
          <span className="text-xs text-ink-3">only the applicant and the beneficiary may sign</span>
        ) : youSigned ? (
          <span className="text-xs text-ink-3">you have signed — waiting on the other party</span>
        ) : null}
        {hash ? <Ext href={txUrl(hash)}><span className="text-xs">transaction</span></Ext> : null}
      </div>

      {sent && bothSigned ? (
        <div className="rounded-lg border-2 border-seal bg-seal/5 p-4">
          <p className="font-semibold text-seal">Amended.</p>
          <p className="mt-1 text-sm text-ink-2">
            Both parties signed the same terms and they now govern the credit. The superseded
            terms stay readable on chain.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Signature({
  who,
  addr,
  signed,
  you,
}: {
  who: string;
  addr: string;
  signed: boolean;
  you: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b rule py-2 last:border-0">
      <div>
        <p className="text-sm font-medium">
          {who}
          {you ? <span className="ml-2 text-xs text-ink-3">you</span> : null}
        </p>
        <p className="mono text-xs text-ink-3">{shortAddr(addr)}</p>
      </div>
      <span className={signed ? "text-sm font-medium text-seal" : "text-sm text-ink-3"}>
        {signed ? "signed" : "not signed"}
      </span>
    </div>
  );
}
