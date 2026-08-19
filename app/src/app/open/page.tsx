"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, decodeEventLog } from "viem";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { ASSETS, NATIVE } from "@/lib/assets";
import { toBaseUnits, toFieldValue } from "@/lib/units";
import { KNOWN_FIELDS, Op, OP_SYMBOL, fieldKey, hashDocument, ZERO_HASH } from "@/lib/lading";
import { Button, Card, Ext, Field, Input, Select } from "@/components/ui";
import { FileUp, Plus, Trash2, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type SpecRow = { label: string; op: Op; value: string };

export default function OpenCredit() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [beneficiary, setBeneficiary] = useState("");
  const [presenters, setPresenters] = useState("");
  const [assetAddr, setAssetAddr] = useState<string>(ASSETS[0].address);
  const [face, setFace] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");
  const [rows, setRows] = useState<SpecRow[]>([
    { label: "quantity", op: Op.EQ, value: "" },
    { label: "latestShipmentDate", op: Op.LTE, value: "" },
  ]);
  const [err, setErr] = useState<string>();

  const asset = ASSETS.find((a) => a.address === assetAddr)!;
  const isNative = asset.address === NATIVE;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isLoading: approveMining, isSuccess: approved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const faceUnits = useMemo(() => {
    try {
      return face ? toBaseUnits(face, asset.decimals) : 0n;
    } catch {
      return 0n;
    }
  }, [face, asset.decimals]);

  const newId = useMemo(() => {
    if (!receipt) return undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== LADING_ADDRESS.toLowerCase()) continue;
      try {
        const parsed = decodeEventLog({ abi: ladingAbi, data: log.data, topics: log.topics });
        if (parsed.eventName === "CreditOpened") {
          return (parsed.args as unknown as { id: bigint }).id;
        }
      } catch {
        /* not our event */
      }
    }
    return undefined;
  }, [receipt]);

  if (newId !== undefined) {
    router.push(`/credit/${newId}`);
  }

  function submit() {
    setErr(undefined);
    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(beneficiary)) throw new Error("beneficiary must be an address");
      const list = presenters
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const nominated = list.length ? list : [beneficiary];
      for (const p of nominated) {
        if (!/^0x[0-9a-fA-F]{40}$/.test(p)) throw new Error(`not an address: ${p}`);
      }
      if (!face) throw new Error("state a face amount");
      const amount = toBaseUnits(face, asset.decimals);
      if (amount === 0n) throw new Error("the face amount cannot be zero");

      const expiryUnix = BigInt(Math.floor(new Date(expiry).getTime() / 1000));
      if (expiryUnix * 1000n <= BigInt(Date.now())) throw new Error("expiry must be in the future");

      const spec = rows
        .filter((r) => r.label.trim() && r.value.trim())
        .map((r) => ({ key: fieldKey(r.label), op: r.op, value: toFieldValue(r.value) }));

      const seen = new Set(spec.map((s) => s.key));
      if (seen.size !== spec.length) throw new Error("a field is named twice");

      writeContract({
        address: LADING_ADDRESS,
        abi: ladingAbi,
        functionName: "openCredit",
        args: [
          beneficiary as `0x${string}`,
          nominated as `0x${string}`[],
          asset.address,
          amount,
          expiryUnix,
          (docHash || ZERO_HASH) as `0x${string}`,
          spec,
        ],
        value: isNative ? amount : 0n,
      });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to explorer</span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Open a Credit</h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Escrow Creation
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          You fund it now. From the moment this transaction confirms, funds are unreachable — by the beneficiary until they present conforming documents, and <strong className="text-slate-200">by you</strong> until expiry. There is zero administrator release button.
        </p>
      </div>

      <Card className="space-y-6">
        <Field label="Beneficiary Address" hint="Paid in full the moment a conforming presentation is made on chain.">
          <Input
            placeholder="0x…"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
        </Field>

        <Field
          label="Nominated Presenters"
          hint="Who may present documents. Leave blank and only the beneficiary may. Separate multiple with commas."
        >
          <Input
            placeholder="0x… , 0x…"
            value={presenters}
            onChange={(e) => setPresenters(e.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Asset" hint={asset.note}>
            <Select value={assetAddr} onChange={(e) => setAssetAddr(e.target.value)}>
              {ASSETS.map((a) => (
                <option key={a.address} value={a.address} className="bg-slate-900 text-slate-100">
                  {a.symbol}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Face Amount" hint={`${asset.symbol} has ${asset.decimals} decimals`}>
            <Input placeholder="100.00" value={face} onChange={(e) => setFace(e.target.value)} />
          </Field>
        </div>

        <Field
          label="Expiry Timestamp"
          hint="Absolute. A conforming presentation one second later is refused, and you may reclaim 100% of the funds."
        >
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>

        <Field
          label="Required Document"
          hint="Hashed locally in your browser. The file content is never uploaded anywhere — only its SHA-256 hash is recorded on-chain."
        >
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center transition-colors hover:border-emerald-500/50">
            <FileUp className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Select or drop required document to compute SHA-256
            </p>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setDocName(f.name);
                setDocHash(await hashDocument(f));
              }}
            />
            {docHash ? (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-center w-full max-w-md">
                <p className="text-xs font-bold text-emerald-400">{docName}</p>
                <p className="mono text-[11px] text-slate-300 truncate">{docHash}</p>
              </div>
            ) : null}
          </div>
        </Field>

        <div>
          <span className="label text-slate-400 font-semibold">Bounding Conditions</span>
          <p className="mb-3 mt-1 text-xs text-slate-400">
            Each condition is evaluated mechanically on chain, in order. A presentation must satisfy 100% of conditions.
          </p>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                <Select
                  value={r.label}
                  onChange={(e) => setRows(edit(rows, i, { label: e.target.value }))}
                  className="flex-1 min-w-[140px]"
                >
                  {KNOWN_FIELDS.map((f) => (
                    <option key={f} value={f} className="bg-slate-900 text-slate-100">
                      {f}
                    </option>
                  ))}
                </Select>
                <Select
                  value={r.op}
                  onChange={(e) => setRows(edit(rows, i, { op: Number(e.target.value) as Op }))}
                  className="w-24 shrink-0"
                >
                  {[Op.EQ, Op.LTE, Op.GTE].map((o) => (
                    <option key={o} value={o} className="bg-slate-900 text-slate-100">
                      {OP_SYMBOL[o]}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="e.g. 500"
                  value={r.value}
                  onChange={(e) => setRows(edit(rows, i, { value: e.target.value }))}
                  className="w-36 shrink-0"
                />
                <button
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRows([...rows, { label: KNOWN_FIELDS[0], op: Op.EQ, value: "" }])}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            disabled={rows.length >= 16}
          >
            <Plus className="h-4 w-4" />
            <span>Add Condition</span>
          </button>
        </div>
      </Card>

      {err ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        {!isConnected ? (
          <p className="text-sm text-slate-400">Connect wallet to open credit.</p>
        ) : !isNative && !approved ? (
          <Button
            size="lg"
            disabled={approving || approveMining || faceUnits === 0n}
            onClick={() =>
              writeApprove({
                address: asset.address,
                abi: erc20Abi,
                functionName: "approve",
                args: [LADING_ADDRESS, faceUnits],
              })
            }
          >
            {approving || approveMining ? "Approving Token Escrow…" : `Approve ${face || ""} ${asset.symbol}`}
          </Button>
        ) : (
          <Button size="lg" disabled={isPending || mining} onClick={submit}>
            {isPending ? "Confirm in Wallet…" : mining ? "Funding Credit Escrow…" : "Open & Fund Credit"}
          </Button>
        )}

        {hash ? (
          <Ext href={txUrl(hash)}>
            <span className="text-xs">view transaction</span>
          </Ext>
        ) : null}
        {hash && !mining && newId === undefined ? (
          <button className="text-xs text-slate-400 underline hover:text-white" onClick={() => reset()}>
            start over
          </button>
        ) : null}
      </div>

      {address ? (
        <p className="text-xs text-slate-400">
          Opening as <span className="mono text-slate-300">{address}</span> — you are designated as applicant, and post-expiry refund returns to this address.
        </p>
      ) : null}
    </div>
  );
}

function edit(rows: SpecRow[], i: number, patch: Partial<SpecRow>): SpecRow[] {
  return rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
}

function defaultExpiry() {
  const d = new Date(Date.now() + 3 * 86400_000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

