"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, addrUrl, txUrl } from "@/lib/chain";
import { assetOf, NATIVE } from "@/lib/assets";
import { fromBaseUnits } from "@/lib/units";
import { useAssetDecimals, useCredit, useNotices, useSpec, useTokenSymbol } from "@/lib/hooks";
import {
  asDate,
  countdown,
  isExpired,
  labelOf,
  Op,
  OP_LABEL,
  shortAddr,
  State,
  STATE_LABEL,
} from "@/lib/lading";
import { Badge, Button, Card, Empty, Ext, Row } from "@/components/ui";
import { NoticeRow } from "@/components/Notice";

export default function CreditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address } = useAccount();

  const { data: credit, error } = useCredit(id);
  const { data: spec } = useSpec(id);
  const { data: notices } = useNotices(id);

  const decimals = useAssetDecimals(credit?.asset);
  const symbol = useTokenSymbol(credit?.asset);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: refunded } = useWaitForTransactionReceipt({ hash });

  // The countdown has to tick, and expiry is the hinge the whole page turns on.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (id === undefined) return <Empty>That is not a credit number.</Empty>;
  if (error) return <Empty>No credit #{idParam} exists on this contract.</Empty>;
  if (!credit) return <Empty>Reading the chain…</Empty>;

  const state = Number(credit.state) as State;
  const expired = isExpired(credit.expiry);
  const amount = `${fromBaseUnits(credit.faceAmount, decimals)} ${symbol}`;
  const isApplicant = address?.toLowerCase() === credit.applicant.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Credit #{idParam}</p>
          <h1 className="mono mt-1 text-3xl font-semibold tracking-tight">{amount}</h1>
        </div>
        <div className="flex items-center gap-2">
          {state === State.Honoured ? (
            <Badge tone="honoured">honoured</Badge>
          ) : state === State.Refunded ? (
            <Badge tone="refunded">refunded</Badge>
          ) : expired ? (
            <Badge tone="warn">expired · awaiting refund</Badge>
          ) : (
            <Badge tone="open">open · {countdown(credit.expiry)} left</Badge>
          )}
        </div>
      </div>

      {state === State.Honoured ? (
        <div className="rounded-lg border-2 border-seal bg-seal/5 p-5">
          <p className="text-2xl font-bold uppercase tracking-tight text-seal">Honoured — paid</p>
          <p className="mt-1 text-sm text-ink-2">
            The documents conformed and {amount} went to the beneficiary in that same transaction.
            Nothing was released by anyone; there is nobody here who could have.
          </p>
        </div>
      ) : null}

      {state === State.Refunded ? (
        <div className="rounded-lg border rule bg-paper-2 p-5">
          <p className="text-xl font-semibold tracking-tight">Refunded</p>
          <p className="mt-1 text-sm text-ink-2">
            The credit lapsed without a conforming presentation and {amount} returned to the
            applicant.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Terms</h2>
          <Row k="state">{STATE_LABEL[state]}</Row>
          <Row k="applicant">
            <Ext href={addrUrl(credit.applicant)}>{shortAddr(credit.applicant)}</Ext>
          </Row>
          <Row k="beneficiary">
            <Ext href={addrUrl(credit.beneficiary)}>{shortAddr(credit.beneficiary)}</Ext>
          </Row>
          <Row k="asset">
            {credit.asset === NATIVE ? (
              <span className="mono">{symbol} (native)</span>
            ) : (
              <Ext href={addrUrl(credit.asset)}>
                {symbol} · {assetOf(credit.asset).decimals} dp
              </Ext>
            )}
          </Row>
          <Row k="face amount">
            <span className="mono">{amount}</span>
          </Row>
          <Row k="expiry">
            <span className="mono">{asDate(credit.expiry)}</span>
          </Row>
          <Row k="document">
            <span className="mono" title={credit.docHash}>
              {credit.docHash.slice(0, 18)}…
            </span>
          </Row>
          {credit.amendmentSeq > 0 ? (
            <Row k="amendments">
              <span className="mono">{credit.amendmentSeq}</span>
            </Row>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Conditions</h2>
          {!spec || spec.length === 0 ? (
            <p className="text-sm text-ink-2">
              None beyond the document itself. A pure documentary credit: present the agreed
              document and it is honoured.
            </p>
          ) : (
            <ul className="space-y-2">
              {spec.map((f, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 border-b rule py-2 last:border-0">
                  <span className="mono text-sm">{labelOf(f.key)}</span>
                  <span className="text-sm text-ink-2">
                    {OP_LABEL[Number(f.op) as Op]}{" "}
                    <span className="mono font-medium text-ink">{f.value.toString()}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {state === State.Open ? (
        <div className="flex flex-wrap items-center gap-3">
          {!expired ? (
            <Link href={`/credit/${idParam}/present`}>
              <Button>Present documents</Button>
            </Link>
          ) : null}

          <Link href={`/credit/${idParam}/amend`}>
            <Button variant="ghost">Amend the terms</Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={!expired || isPending || mining}
              onClick={() =>
                writeContract({
                  address: LADING_ADDRESS,
                  abi: ladingAbi,
                  functionName: "refund",
                  args: [id],
                })
              }
            >
              {isPending ? "Confirm in wallet…" : mining ? "Refunding…" : "Refund the applicant"}
            </Button>
            {!expired ? (
              <span className="text-xs text-ink-3">
                available in {countdown(credit.expiry)} — the undertaking stands until then, and
                not even the applicant can withdraw it
              </span>
            ) : (
              <span className="text-xs text-ink-3">
                anyone may trigger this; the money can only go to the applicant
                {isApplicant ? " — that is you" : ""}
              </span>
            )}
          </div>

          {hash ? <Ext href={txUrl(hash)}><span className="text-xs">transaction</span></Ext> : null}
          {refunded ? <span className="text-xs text-seal">refunded</span> : null}
        </div>
      ) : null}

      <Card>
        <h2 className="mb-1 text-sm font-semibold">Notices of refusal</h2>
        <p className="mb-3 text-xs text-ink-3">
          Every refused presentation, kept with its reason. Under UCP 600 art. 16 a refusal must
          state each discrepancy — a credit that forgets why it refused someone is not evidence of
          anything.
        </p>
        {!notices || notices.length === 0 ? (
          <Empty>No presentation has been refused.</Empty>
        ) : (
          <ul>
            {[...notices].reverse().map((n, i) => (
              <NoticeRow key={i} notice={n} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
