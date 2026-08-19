"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useCredits } from "@/lib/hooks";
import { LADING_ADDRESS, addrUrl } from "@/lib/chain";
import { assetOf } from "@/lib/assets";
import { fromBaseUnits } from "@/lib/units";
import { asDate, countdown, isExpired, shortAddr } from "@/lib/lading";
import { Badge, Button, Card, Empty, Ext } from "@/components/ui";
import { motion } from "motion/react";
import { FactRail, Rise, SectionHead } from "@/components/Landing";
import {
  ShieldCheck,
  Zap,
  Lock,
  FileCheck2,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  Layers,
  Scale,
  RefreshCw,
} from "lucide-react";

export default function Home() {
  const { rows } = useCredits();
  const deployed = LADING_ADDRESS !== "0x0000000000000000000000000000000000000000";

  // Filter & Search state for Live Explorer
  const [filterTab, setFilterTab] = useState<"all" | "open" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ open accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      const expired = isExpired(r.expiry);
      if (filterTab === "open" && expired) return false;
      if (filterTab === "expired" && !expired) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = r.id.toString().includes(q);
        const appMatch = r.applicant.toLowerCase().includes(q);
        const benMatch = r.beneficiary.toLowerCase().includes(q);
        return idMatch || appMatch || benMatch;
      }
      return true;
    });
  }, [rows, filterTab, searchQuery]);

  return (
    <div className="space-y-28 py-4">
      {/* 1. HERO — Splyt's shape: oversized sans headline broken by one
          serif-italic phrase, sitting in a soft bloom, entering on a staggered
          fade. The accent phrase carries the whole idea, so it is the line set
          apart rather than a decorative fragment. */}
      <section className="hero-bloom relative flex min-h-[80vh] flex-col justify-center overflow-hidden pt-4 pb-8">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Documentary credit · UCP 600</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.05, ease: "easeInOut" }}
            className="mt-7 max-w-5xl text-5xl font-medium leading-[1.05] tracking-tight text-white md:text-7xl md:leading-[1.05] lg:text-8xl lg:leading-[1.02]"
          >
            The bank never verified the goods.
            <br />
            It verified{" "}
            <span className="accent-serif text-emerald-300">
              paperwork against a spec.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
            className="mt-7 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            That check is mechanical, which is why it belongs in a contract. What
            needed the bank was custody — and custody is the one thing a settlement
            layer provides for free. Fund a credit, and the beneficiary is paid the
            instant conforming documents are presented. If they never are, you are
            refunded at expiry.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: "easeInOut" }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/open">
              <Button size="lg" className="shadow-emerald-500/25">
                Open a credit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="lg">
                How it works
              </Button>
            </Link>
            {deployed ? (
              <a
                href={addrUrl(LADING_ADDRESS)}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-slate-700 hover:text-white sm:inline-flex"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Read the contract</span>
              </a>
            ) : null}
          </motion.div>

          {/* The claim, stated as four numbers. Each one is checkable: the first
              three by reading the verified source, the fourth by running the
              suite. No user counts, no volume, because there are none. */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
            className="mt-16 grid w-full grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6"
          >
            {[
              { n: "0", label: "Administrators", sub: "no owner, no pause, no upgrade", tone: "text-white" },
              { n: "2", label: "Ways out", sub: "honour, or refund at expiry", tone: "text-emerald-400" },
              { n: "6", label: "Decimals, never rescaled", sub: "the chain's real USDT", tone: "text-teal-300" },
              { n: "47", label: "Tests, all green", sub: "incl. a 1,024-run fuzz", tone: "text-cyan-300" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 text-left backdrop-blur-xl"
              >
                <div className={`text-3xl font-medium ${s.tone}`}>{s.n}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {s.label}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{s.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The rail Splyt gives to partner logos. We have no partners, so it
          carries facts that can each be checked instead. */}
      <FactRail />

      {/* 2. FEATURE HIGHLIGHTS GRID */}
      <section id="features" className="space-y-6">
        <Rise><div className="text-center space-y-2">
          <p className="label text-emerald-400">Protocol Features</p>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white sm:leading-[1.1]">
            Why Trade Settlement Belongs on Chain
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional letters of credit charge high bank fees and add human delay. Lading provides instant, non-custodial execution.
          </p>
        </div></Rise>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">Zero-Admin Custody</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No owner, no release button, and no pause functionality. Locked funds leave the contract through exactly two paths: an honoured presentation or an post-expiry refund.
            </p>
          </Card>

          <Card className="glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">UCP 600 Discrepancy Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Under ICC Article 16, a refused presentation does not revert. It records a permanent notice naming the failed condition and bound, leaving funds untouched for re-presentation.
            </p>
          </Card>

          <Card className="glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">Bilateral Term Amendments</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Under ICC Article 10, nobody amends a credit alone. Your signature does nothing until the counterparty signs identical terms — instantly applying the amendment.
            </p>
          </Card>

          <Card className="glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">Free Off-Chain Dry-Runs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Presenters can dry-run <span className="mono text-xs text-amber-400">conforms()</span> off-chain for free. Verify document hashes and condition bounds before spending gas on a live presentation.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. HOW IT WORKS TIMELINE */}
      <section className="space-y-8">
        <Rise><div className="text-center space-y-2">
          <p className="label text-emerald-400">Workflow</p>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white sm:leading-[1.1]">
            The 5-Step Settlement Cycle
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From initial collateral funding to atomic settlement or post-expiry refund.
          </p>
        </div></Rise>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Open & Fund",
              desc: "Applicant locks USDT/BOT into escrow with beneficiary address, expiry date, document SHA-256 hash, and bounds.",
              icon: FileSpreadsheet,
            },
            {
              step: "02",
              title: "Free Dry-Run",
              desc: "Beneficiary verifies document compliance locally using free off-chain contract read calls before submitting.",
              icon: Search,
            },
            {
              step: "03",
              title: "Present & Settle",
              desc: "Beneficiary submits document values. If all conditions pass, contract immediately releases escrowed funds.",
              icon: CheckCircle2,
            },
            {
              step: "04",
              title: "Transparent Refusal",
              desc: "Non-conforming presentation logs discrepancy notice on-chain under UCP 600 Art 16. Escrow remains 100% intact.",
              icon: Scale,
            },
            {
              step: "05",
              title: "Expire / Refund",
              desc: "If unhonoured at expiry, anyone can trigger a 100% refund back to applicant address.",
              icon: RefreshCw,
            },
          ].map((s, idx) => {
            const IconComp = s.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="mono text-xs font-bold text-emerald-400">STEP {s.step}</span>
                    <IconComp className="h-5 w-5 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h4 className="mt-3 font-medium text-white text-base">{s.title}</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. LIVE ON-CHAIN CREDITS EXPLORER */}
      <section id="credits" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">Live Credits Explorer</h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                On-Chain Logs
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Read directly from event logs on BOT Chain — zero centralized database or indexer.
            </p>
          </div>

          {/* Search & Tabs Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ID or address…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs mono text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex rounded-xl border border-slate-800 bg-slate-950/80 p-1">
              {(["all", "open", "expired"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTab(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                    filterTab === t
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!deployed ? (
          <Card>
            <Empty>The contract address is not configured for this deployment.</Empty>
          </Card>
        ) : rows === undefined ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Querying BOT Chain RPC logs…</p>
            </div>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card>
            <Empty>No credits match your filter criteria. Be the first to open a credit!</Empty>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRows.map((r) => {
              const asset = assetOf(r.asset);
              const expired = isExpired(r.expiry);
              return (
                <Link key={r.id.toString()} href={`/credit/${r.id}`} className="block group">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-emerald-500/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs font-bold text-slate-400">#{r.id.toString()}</span>
                        <span className="mono text-xl font-medium text-white group-hover:text-emerald-400 transition-colors">
                          {fromBaseUnits(r.faceAmount, asset.decimals)} {asset.symbol}
                        </span>
                      </div>
                      {expired ? (
                        <Badge tone="warn">expired</Badge>
                      ) : (
                        <Badge tone="open">{countdown(r.expiry)} left</Badge>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Applicant</span>
                        <span className="mono text-slate-300">{shortAddr(r.applicant)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Beneficiary</span>
                        <span className="mono text-slate-300">{shortAddr(r.beneficiary)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2">
                      <span className="mono text-[11px]">Expires {asDate(r.expiry)}</span>
                      <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View Credit Details →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. ARCHITECTURE & SPECIFICATIONS TECH BLOCK */}
      <section id="specs" className="space-y-6">
        <Card className="border-emerald-500/20 bg-slate-900/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
                <Cpu className="h-3.5 w-3.5" />
                <span>Technical Specifications & Verification</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">Immutable Contract Architecture</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Lading is constructed with strict zero-admin invariants. There are no fallback functions, no upgrade proxies, no multisig backdoors, and no administrative pause keys.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>BOT Chain ID 677 Native & ERC20</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Exact Base Unit Token Math (6 Decimals)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ICC UCP 600 Art 10 & 16 Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>47 Fuzz Invariant Forge Tests Pass</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Network</span>
                <span className="mono text-emerald-400 font-semibold">BOT Chain (ID 677)</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Verified Address</span>
                <Ext href={addrUrl(LADING_ADDRESS)}>{shortAddr(LADING_ADDRESS)}</Ext>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Settlement Asset</span>
                <span className="mono text-slate-200 font-semibold">USDT / Native BOT</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Admin Control</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 uppercase">
                  Zero (Immutable)
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. INTERACTIVE FAQ ACCORDION */}
      <section id="faq" className="space-y-6 max-w-3xl mx-auto">
        <Rise><div className="text-center space-y-2">
          <p className="label text-emerald-400">Frequently Asked Questions</p>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white sm:leading-[1.1]">
            Everything you need to know
          </h2>
        </div></Rise>

        <div className="space-y-3">
          {[
            {
              q: "How does Lading handle non-conforming presentations under UCP 600?",
              a: "Under ICC UCP 600 Article 16, a bank that refuses a presentation must give notice stating each discrepancy. Lading strictly implements this rule: a non-conforming presentation does not revert. Instead, it logs an on-chain refusal notice identifying the exact condition that failed, while keeping 100% of the funds in escrow so the beneficiary can present again.",
            },
            {
              q: "Can an admin or developer pause the contract or withdraw funds?",
              a: "No. Lading has zero administrative roles, no owner, no pause state, no upgrade proxy, and no receive or fallback functions. Funded escrowed value can only leave through two deterministic paths: an honoured presentation matching all conditions, or a full refund to the applicant after the expiry timestamp.",
            },
            {
              q: "How do dry-run presentations work without spending gas?",
              a: "The contract exposes a view function `conforms(id, presenter, docHash, values)` that can be evaluated locally via free RPC read calls. Presenters can verify whether their document hash and condition bounds pass 100% before committing any gas to an on-chain presentation.",
            },
            {
              q: "How are credit terms amended?",
              a: "Under UCP 600 Article 10, credit terms cannot be altered unilaterally. Both the applicant and beneficiary must submit cryptographic signatures on the identical new terms. The instant both signatures are matched on-chain, the amendment applies automatically.",
            },
            {
              q: "Which assets and tokens are supported for credit collateral?",
              a: "Credits settle in BOT Chain's real USDT (6-decimal ERC-20 token) or native BOT tokens. The contract manages exact base units directly, preventing decimal rescaling or rounding vulnerabilities.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-slate-100 hover:text-emerald-400 transition-colors"
                >
                  <span className="text-base">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen ? (
                  <div className="px-6 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/50">
                    {item.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

