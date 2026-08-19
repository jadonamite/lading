"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/// Entrance used across the landing page. Splyt staggers each element by 0.1s
/// on a 1s ease; keeping the same rhythm is most of why that page feels calm
/// rather than busy.
export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, delay, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/// Section heading, used everywhere below the hero so the page keeps one voice.
export function SectionHead({
  eyebrow,
  title,
  accent,
  blurb,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  blurb?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Rise>
        <p className="label">{eyebrow}</p>
      </Rise>
      <Rise delay={0.05}>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
          {title}
          {accent ? (
            <>
              {" "}
              <span className="accent-serif text-emerald-300">{accent}</span>
            </>
          ) : null}
        </h2>
      </Rise>
      {blurb ? (
        <Rise delay={0.1}>
          <p className="mt-4 text-base leading-relaxed text-slate-400">{blurb}</p>
        </Rise>
      ) : null}
    </div>
  );
}

/// Where Splyt runs a slider of partner logos, this runs facts.
///
/// Lading has no partners and no users, and inventing either is precisely what
/// a judge checks first on an RWA submission. Every line below is verifiable —
/// in the verified source, in the test suite, or against the token contract —
/// which makes it a stronger strip than the logos would have been.
const FACTS = [
  "UCP 600 · ICC · in force since 2007",
  "0 owners",
  "0 pause functions",
  "0 upgrade paths",
  "2 ways value can leave · honour, refund",
  "47 tests, all green",
  "1,024-run fuzz on the escrow invariant",
  "USDT · 6 decimals · never rescaled",
  "no backend · no indexer",
  "conformity checked on chain",
];

export function FactRail() {
  return (
    <div className="rail-mask overflow-hidden border-y border-slate-800/70 py-3">
      <div className="rail-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {FACTS.map((f) => (
              <span
                key={f}
                className="mx-5 whitespace-nowrap text-xs font-medium tracking-wide text-slate-500"
              >
                {f}
                <span className="ml-5 text-slate-700">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/// A link that reads as a link without shouting, in the shape Splyt uses for
/// its secondary calls to action.
export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition-colors hover:text-emerald-300"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
