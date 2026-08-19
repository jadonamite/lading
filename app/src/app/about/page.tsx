import Link from "next/link";
import { LADING_ADDRESS, addrUrl, USDT } from "@/lib/chain";
import { Card, Ext } from "@/components/ui";

export const metadata = { title: "How Lading works" };

export default function About() {
  const deployed = LADING_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="label">How it works</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          A four-hundred-year-old instrument, minus the bank
        </h1>
      </div>

      <section className="space-y-4 text-ink-2">
        <p>
          A seller in one country will not ship to a buyer in another they have never met, and the
          buyer will not pay first. The documentary credit resolved that standoff by putting a
          bank in the middle: the buyer&apos;s bank undertakes to pay the seller — not when the
          goods arrive, but when the <em>paperwork</em> arrives and matches what was agreed.
        </p>
        <p>
          The rules are UCP 600, published by the International Chamber of Commerce and in force
          since 2007. The insight that makes it work is a strange one:{" "}
          <strong className="text-ink">the bank never verifies the goods.</strong> It verifies
          documents against a specification, mechanically, and pays or refuses on that basis alone.
        </p>
        <p>
          A mechanical check is exactly what a contract does well. What genuinely needed a bank was
          custody of the money in between — and custody is the one thing a settlement layer
          provides for free.
        </p>
      </section>

      <Card>
        <h2 className="mb-3 font-semibold">The whole instrument</h2>
        <ol className="space-y-3 text-sm text-ink-2">
          <li>
            <strong className="text-ink">Open.</strong> The applicant states the beneficiary, who
            may present, the asset and amount, an expiry, the required document, and a list of
            conditions. The money moves in with the terms; from that instant the applicant cannot
            reach it either.
          </li>
          <li>
            <strong className="text-ink">Present.</strong> A nominated presenter supplies the
            document and its stated values. The contract checks the document hash, then walks the
            conditions in order. Conforming means paid — in that same transaction.
          </li>
          <li>
            <strong className="text-ink">Refuse.</strong> A non-conforming presentation does not
            revert. It records a notice naming the failed condition, its bound, and what was
            presented. The credit stays open; the money never moved. Art. 16 requires a refusing
            bank to state each discrepancy, and a revert would record nothing at all.
          </li>
          <li>
            <strong className="text-ink">Amend.</strong> Terms change only when applicant and
            beneficiary have both signed the identical amendment (art. 10). One signature does
            nothing.
          </li>
          <li>
            <strong className="text-ink">Expire.</strong> After expiry, an unhonoured credit
            refunds the applicant in full. Anyone may trigger it, because the money can only go to
            one place.
          </li>
        </ol>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">There is no administrator</h2>
        <p className="text-sm text-ink-2">
          No owner, no role, no pause, no upgrade path, no <span className="mono">selfdestruct</span>
          , and no <span className="mono">receive</span> or <span className="mono">fallback</span>.
          Funded value leaves through exactly two functions — an honoured presentation and a refund
          after expiry — and neither consults anyone&apos;s discretion. A test fuzzes every external
          function from every address across every state and asserts the escrow balance only ever
          changes by the exact face amount, through those two paths.
        </p>
        <p className="mt-3 text-sm text-ink-2">
          This is the part you should not take on trust.{" "}
          {deployed ? (
            <>
              The source is verified on the explorer:{" "}
              <Ext href={addrUrl(LADING_ADDRESS)}>read it</Ext>. It is 470 lines.
            </>
          ) : (
            <>The source is verified on the explorer once deployed.</>
          )}
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">What this does not claim</h2>
        <p className="text-sm text-ink-2">
          The chain proves that the bytes presented matched the bytes agreed, and that the stated
          values satisfied the stated bounds. It does not prove the goods exist, that they were
          shipped, or that the document is truthful. That gap is not an oversight — it is the same
          gap UCP 600 runs on by design, which is why the instrument names an inspector when the
          gap matters. Any product claiming to have closed it from a browser is lying to you.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">On this chain</h2>
        <p className="text-sm text-ink-2">
          Credits settle in the chain&apos;s real <Ext href={addrUrl(USDT)}>USDT</Ext> — a
          six-decimal token with 289,324 holders and verified source — or in native BOT. The
          contract never converts decimals at all: it holds and moves the asset&apos;s own base
          unit, so an amount cannot be silently rescaled on the way in or out.
        </p>
      </Card>

      <p className="text-sm">
        <Link href="/open" className="text-seal underline">
          Open a credit →
        </Link>
      </p>
    </div>
  );
}
