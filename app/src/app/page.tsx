"use client";

import Link from "next/link";
import { useCredits } from "@/lib/hooks";
import { LADING_ADDRESS, addrUrl } from "@/lib/chain";
import { assetOf } from "@/lib/assets";
import { fromBaseUnits } from "@/lib/units";
import { asDate, countdown, isExpired, shortAddr } from "@/lib/lading";
import { Badge, Button, Card, Empty, Ext } from "@/components/ui";

export default function Home() {
  const { rows } = useCredits();
  const deployed = LADING_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="space-y-10">
      <section className="pt-4">
        <p className="label">Documentary credit · UCP 600</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          The bank never verified the goods. It verified paperwork against a specification.
        </h1>
        <p className="mt-4 max-w-2xl text-ink-2">
          That check is mechanical, which is why it belongs in a contract. What needed the bank
          was custody — and custody is the one thing a settlement layer provides for free. Open a
          credit, and the beneficiary is paid the instant conforming documents are presented. If
          they never are, you are refunded at expiry.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-ink-2">
          <strong>There is no administrator.</strong> No owner, no pause, no upgrade path, no
          release button. Funded value leaves this contract through exactly two paths — an
          honoured presentation, or a refund after expiry — and neither consults anybody&apos;s
          discretion, including ours.{" "}
          {deployed ? (
            <>
              Read it yourself: <Ext href={addrUrl(LADING_ADDRESS)}>{shortAddr(LADING_ADDRESS)}</Ext>
            </>
          ) : null}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/open">
            <Button>Open a credit</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">How it works</Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Credits on chain</h2>
          <span className="text-xs text-ink-3">read from the contract&apos;s own logs — no indexer</span>
        </div>

        {!deployed ? (
          <Card>
            <Empty>The contract address is not configured for this deployment.</Empty>
          </Card>
        ) : rows === undefined ? (
          <Card>
            <Empty>Reading the chain…</Empty>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <Empty>No credits opened yet. Be the first.</Empty>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const asset = assetOf(r.asset);
              const expired = isExpired(r.expiry);
              return (
                <li key={r.id.toString()}>
                  <Link href={`/credit/${r.id}`} className="block">
                    <Card className="transition-colors hover:border-seal">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div className="flex items-baseline gap-3">
                          <span className="mono text-sm text-ink-3">#{r.id.toString()}</span>
                          <span className="mono text-lg font-semibold">
                            {fromBaseUnits(r.faceAmount, asset.decimals)} {asset.symbol}
                          </span>
                        </div>
                        {expired ? (
                          <Badge tone="warn">expired</Badge>
                        ) : (
                          <Badge tone="open">{countdown(r.expiry)} left</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-3">
                        <span className="mono">applicant {shortAddr(r.applicant)}</span>
                        <span className="mono">beneficiary {shortAddr(r.beneficiary)}</span>
                        <span className="mono">expires {asDate(r.expiry)}</span>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
