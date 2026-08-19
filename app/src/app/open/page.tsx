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

  // The id is read out of the CreditOpened log rather than guessed from nextId — two people
  // opening credits in the same block would otherwise land on the same page.
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Open a credit</h1>
        <p className="mt-2 text-sm text-ink-2">
          You fund it now. From the moment this transaction confirms the money is unreachable —
          by the beneficiary until they present conforming documents, and{" "}
          <strong>by you</strong> until expiry. That is the undertaking; there is no button that
          undoes it.
        </p>
      </div>

      <Card className="space-y-5">
        <Field label="Beneficiary" hint="Paid in full the moment a conforming presentation is made.">
          <Input
            placeholder="0x…"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
        </Field>

        <Field
          label="Nominated presenters"
          hint="Who may present documents. Leave blank and only the beneficiary may. Separate several with commas — a named inspector belongs here."
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
                <option key={a.address} value={a.address}>
                  {a.symbol}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Face amount" hint={`${asset.symbol} has ${asset.decimals} decimals`}>
            <Input placeholder="12.50" value={face} onChange={(e) => setFace(e.target.value)} />
          </Field>
        </div>

        <Field
          label="Expiry"
          hint="Absolute. A conforming presentation one second later is refused, and you may reclaim the funds."
        >
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>

        <Field
          label="Required document"
          hint="Hashed in your browser. The file itself is never uploaded anywhere — the chain proves the bytes matched, which is exactly what a bank checks and exactly what it does not."
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

        <div>
          <span className="label">Conditions</span>
          <p className="mb-2 mt-1 text-xs text-ink-3">
            Each condition is checked on chain, in the order you write them. A presentation must
            satisfy every one.
          </p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={r.label}
                  onChange={(e) => setRows(edit(rows, i, { label: e.target.value }))}
                  className="flex-1"
                >
                  {KNOWN_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
                <Select
                  value={r.op}
                  onChange={(e) => setRows(edit(rows, i, { op: Number(e.target.value) as Op }))}
                  className="w-20"
                >
                  {[Op.EQ, Op.LTE, Op.GTE].map((o) => (
                    <option key={o} value={o}>
                      {OP_SYMBOL[o]}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="500"
                  value={r.value}
                  onChange={(e) => setRows(edit(rows, i, { value: e.target.value }))}
                  className="w-32"
                />
                <button
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="px-2 text-ink-3 hover:text-refuse"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRows([...rows, { label: KNOWN_FIELDS[0], op: Op.EQ, value: "" }])}
            className="mt-2 text-sm text-seal hover:underline"
            disabled={rows.length >= 16}
          >
            + add a condition
          </button>
        </div>
      </Card>

      {err ? <p className="text-sm text-refuse">{err}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        {!isConnected ? (
          <p className="text-sm text-ink-3">Connect a wallet to open a credit.</p>
        ) : !isNative && !approved ? (
          <Button
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
            {approving || approveMining ? "Approving…" : `Approve ${face || ""} ${asset.symbol}`}
          </Button>
        ) : (
          <Button disabled={isPending || mining} onClick={submit}>
            {isPending ? "Confirm in wallet…" : mining ? "Funding…" : "Open and fund"}
          </Button>
        )}

        {hash ? (
          <Ext href={txUrl(hash)}>
            <span className="text-xs">view transaction</span>
          </Ext>
        ) : null}
        {hash && !mining && newId === undefined ? (
          <button className="text-xs text-ink-3 underline" onClick={() => reset()}>
            start over
          </button>
        ) : null}
      </div>

      {address ? (
        <p className="text-xs text-ink-3">
          Opening as <span className="mono">{address}</span> — you are the applicant, and the
          refund at expiry pays you.
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
