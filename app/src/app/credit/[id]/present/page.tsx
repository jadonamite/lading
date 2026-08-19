"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { fromBaseUnits, toFieldValue } from "@/lib/units";
import { useAssetDecimals, useCredit, useIsNominated, useSpec, useTokenSymbol } from "@/lib/hooks";
import {
  hashDocument,
  isExpired,
  labelOf,
  Op,
  OP_LABEL,
  State,
  ZERO_HASH,
  type Finding,
} from "@/lib/lading";
import { Button, Card, Empty, Ext, Field, Input } from "@/components/ui";
import { RefusalPanel } from "@/components/Notice";

export default function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address, isConnected } = useAccount();

  const { data: credit } = useCredit(id);
  const { data: spec } = useSpec(id);
  const { data: nominated } = useIsNominated(id, address);
  const decimals = useAssetDecimals(credit?.asset);
  const symbol = useTokenSymbol(credit?.asset);

  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const { keys, vals, parseError } = useMemo(() => {
    if (!spec) return { keys: [], vals: [], parseError: undefined };
    const k: `0x${string}`[] = [];
    const v: bigint[] = [];
    for (const f of spec) {
      const raw = values[f.key] ?? "";
      if (!raw.trim()) continue;
      try {
        v.push(toFieldValue(raw));
        k.push(f.key);
      } catch {
        return { keys: [], vals: [], parseError: `${labelOf(f.key)} must be a whole number` };
      }
    }
    return { keys: k, vals: v, parseError: undefined };
  }, [spec, values]);

  /// The dry-run. `conforms` is a view, so this costs nothing and cannot change anything —
  /// the user sees the discrepancy *before* deciding whether to spend gas on a presentation.
  /// A trade document is re-cut and re-presented all the time; making that loop free is the
  /// difference between a usable instrument and a slot machine.
  const { data: finding } = useReadContract({
    address: LADING_ADDRESS,
    abi: ladingAbi,
    functionName: "conforms",
    args: id !== undefined ? [id, (docHash || ZERO_HASH) as `0x${string}`, keys, vals] : undefined,
    query: { enabled: id !== undefined && !!credit && !parseError },
  }) as { data?: Finding };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const outcome = useMemo(() => {
    if (!receipt) return undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== LADING_ADDRESS.toLowerCase()) continue;
      try {
        const parsed = decodeEventLog({ abi: ladingAbi, data: log.data, topics: log.topics });
        if (parsed.eventName === "PresentationHonoured") return "honoured" as const;
        if (parsed.eventName === "PresentationRefused") return "refused" as const;
      } catch {
        /* not ours */
      }
    }
    return undefined;
  }, [receipt]);

  if (id === undefined) return <Empty>That is not a credit number.</Empty>;
  if (!credit) return <Empty>Reading the chain…</Empty>;

  const state = Number(credit.state) as State;
  const expired = isExpired(credit.expiry);
  const amount = `${fromBaseUnits(credit.faceAmount, decimals)} ${symbol}`;
  const conforming = finding?.ok === true;

  if (state !== State.Open) {
    return (
      <Empty>
        This credit is settled.{" "}
        <Link className="underline" href={`/credit/${idParam}`}>
          Back to the credit
        </Link>
      </Empty>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/credit/${idParam}`} className="text-sm text-ink-3 hover:text-ink">
          ← credit #{idParam}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Present documents</h1>
        <p className="mt-2 text-sm text-ink-2">
          Conforming documents are paid <strong>{amount}</strong> in the same transaction that
          presents them. There is no approval step and nobody to wait for.
        </p>
      </div>

      {expired ? (
        <div className="rounded-lg border-2 border-refuse bg-refuse-2 p-4">
          <p className="font-semibold text-refuse">This credit has expired.</p>
          <p className="mt-1 text-sm text-ink-2">
            Expiry is absolute — a presentation one second late is refused however perfect the
            documents are. The applicant may now reclaim the funds.
          </p>
        </div>
      ) : null}

      {isConnected && nominated === false ? (
        <div className="rounded-lg border rule bg-paper-2 p-4">
          <p className="text-sm">
            <strong>You are not a nominated presenter on this credit.</strong> Only addresses the
            applicant named may present against it — a perfect document from anyone else is still
            refused.
          </p>
        </div>
      ) : null}

      <Card className="space-y-5">
        <Field
          label="The document"
          hint="Hashed here in your browser and compared against the hash the credit calls for. The file is never uploaded."
        >
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
          {docHash ? (
            <p className="mono mt-2 truncate text-xs text-ink-3">
              {docName} → {docHash}
            </p>
          ) : null}
        </Field>

        {spec && spec.length > 0 ? (
          <div>
            <span className="label">Stated values</span>
            <div className="mt-2 space-y-3">
              {spec.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="mono truncate text-sm">{labelOf(f.key)}</p>
                    <p className="text-xs text-ink-3">
                      {OP_LABEL[Number(f.op) as Op]} {f.value.toString()}
                    </p>
                  </div>
                  <Input
                    className="w-36"
                    placeholder="—"
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {parseError ? (
        <p className="text-sm text-refuse">{parseError}</p>
      ) : docHash && finding ? (
        conforming ? (
          <div className="rounded-lg border-2 border-seal bg-seal/5 p-5">
            <p className="text-xl font-bold uppercase tracking-tight text-seal">Conforming</p>
            <p className="mt-1 text-sm text-ink-2">
              Presenting this will pay {amount} to the beneficiary in that same transaction.
            </p>
          </div>
        ) : (
          <div>
            <p className="label mb-2">Checked without spending gas</p>
            <RefusalPanel finding={finding} />
          </div>
        )
      ) : (
        <p className="text-sm text-ink-3">
          Attach the document to see, for free, whether this presentation would conform.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!isConnected || expired || isPending || mining || !docHash}
          onClick={() =>
            writeContract({
              address: LADING_ADDRESS,
              abi: ladingAbi,
              functionName: "present",
              args: [id, docHash as `0x${string}`, keys, vals],
            })
          }
        >
          {isPending ? "Confirm in wallet…" : mining ? "Presenting…" : "Present"}
        </Button>
        {!conforming && docHash && finding ? (
          <span className="text-xs text-ink-3">
            you may present anyway — it will be refused on the record, and cost only gas
          </span>
        ) : null}
        {hash ? <Ext href={txUrl(hash)}><span className="text-xs">transaction</span></Ext> : null}
      </div>

      {outcome === "honoured" ? (
        <div className="rounded-lg border-2 border-seal bg-seal/5 p-5">
          <p className="text-2xl font-bold uppercase tracking-tight text-seal">Honoured — paid</p>
          <p className="mt-1 text-sm text-ink-2">
            {amount} is with the beneficiary.{" "}
            <Link className="underline" href={`/credit/${idParam}`}>
              See the credit
            </Link>
            .
          </p>
        </div>
      ) : outcome === "refused" ? (
        <div>
          <p className="label mb-2">On chain, on the record</p>
          {finding ? <RefusalPanel finding={finding} /> : null}
          <p className="mt-2 text-sm text-ink-2">
            The credit is still open. Correct the discrepancy and present again, or{" "}
            <Link className="underline" href={`/credit/${idParam}/amend`}>
              amend the terms
            </Link>{" "}
            if both parties agree they were wrong.
          </p>
        </div>
      ) : null}
    </div>
  );
}
