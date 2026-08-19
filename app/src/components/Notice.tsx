"use client";

import { Op, OP_LABEL, Reason, labelOf, shortAddr, asDate, type Finding, type Notice } from "@/lib/lading";

/// The refusal panel.
///
/// Under UCP 600 art. 16 a bank that refuses a presentation must give notice stating each
/// discrepancy — it may not simply decline. That obligation is why `present()` does not
/// revert on a non-conforming document: a revert records nothing, and the whole value of a
/// refusal is the reason attached to it.
///
/// Two things have to be unmistakable at a glance, and in this order: **the money did not
/// move**, and **exactly which condition failed**. A user who has just been refused is
/// looking for the loss first. Telling them nothing was lost is the more urgent fact.
export function RefusalPanel({
  finding,
  className,
}: {
  finding: Pick<Finding, "reason" | "field" | "op" | "expected" | "presented">;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border-2 border-refuse bg-refuse-2 p-5 ${className ?? ""}`}>
      <p className="text-2xl font-bold uppercase tracking-tight text-refuse sm:text-3xl">
        Refused — funds unmoved
      </p>
      <p className="mt-1 text-sm text-refuse/80">
        The credit is still open. Nothing was taken, nothing was paid, and you may present again.
      </p>
      <div className="mt-4 border-t border-refuse/25 pt-3">
        <Discrepancy finding={finding} />
      </div>
    </div>
  );
}

export function Discrepancy({
  finding,
}: {
  finding: Pick<Finding, "reason" | "field" | "op" | "expected" | "presented">;
}) {
  const reason = Number(finding.reason) as Reason;

  if (reason === Reason.DocumentHash) {
    return (
      <div className="space-y-2">
        <p className="label !text-refuse">Discrepancy · the document</p>
        <p className="text-sm text-ink">
          The document presented is not the document this credit calls for.
        </p>
        <dl className="mono space-y-1 text-xs">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-3">required</dt>
            <dd className="truncate">{toHash(finding.expected)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-3">presented</dt>
            <dd className="truncate text-refuse">{toHash(finding.presented)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (reason === Reason.FieldMissing) {
    return (
      <div className="space-y-2">
        <p className="label !text-refuse">Discrepancy · a missing field</p>
        <p className="text-sm text-ink">
          The credit requires <strong className="mono">{labelOf(finding.field)}</strong>, and the
          presentation does not state it.
        </p>
        <p className="mono text-xs text-ink-3">
          required: {labelOf(finding.field)} {OP_LABEL[Number(finding.op) as Op]}{" "}
          {finding.expected.toString()}
        </p>
      </div>
    );
  }

  if (reason === Reason.FieldFailed) {
    return (
      <div className="space-y-2">
        <p className="label !text-refuse">Discrepancy · a field out of bounds</p>
        <p className="text-sm text-ink">
          <strong className="mono">{labelOf(finding.field)}</strong>{" "}
          {OP_LABEL[Number(finding.op) as Op]}{" "}
          <strong className="mono">{finding.expected.toString()}</strong> — presented as{" "}
          <strong className="mono text-refuse">{finding.presented.toString()}</strong>.
        </p>
      </div>
    );
  }

  return <p className="text-sm text-ink-2">Conforming.</p>;
}

/// A stored notice of refusal, read back from the chain. Both parties can retrieve every
/// refusal a credit ever received — a credit that quietly forgets why it refused someone is
/// not evidence of anything.
export function NoticeRow({ notice }: { notice: Notice }) {
  return (
    <li className="border-b rule py-3 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="mono text-xs text-ink-3">{shortAddr(notice.presenter)}</span>
        <span className="mono text-xs text-ink-3">{asDate(notice.at)}</span>
      </div>
      <div className="mt-2">
        <Discrepancy finding={notice} />
      </div>
    </li>
  );
}

const toHash = (v: bigint) => "0x" + v.toString(16).padStart(64, "0");
