"use client";

import Link from "next/link";
import Image from "next/image";
import { LADING_ADDRESS, addrUrl, botChain } from "@/lib/chain";
import { shortAddr } from "@/lib/lading";
import { ShieldCheck, ExternalLink, ArrowUpRight, Lock, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/90 text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/Lading.png"
                alt="Lading Logo"
                width={130}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A four-hundred-year-old trade finance instrument, settled mechanically on BOT Chain by smart contract.
              Zero administrator, zero discretion, zero delay.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Compliant with UCP 600 trade principles</span>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div className="space-y-3">
              <h4 className="label text-slate-400 font-bold">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/open" className="hover:text-emerald-400 transition-colors">
                    Open a Credit
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-emerald-400 transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <a href="/#credits" className="hover:text-emerald-400 transition-colors">
                    Live Explorer
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="label text-slate-400 font-bold">Protocol</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/#specs" className="hover:text-emerald-400 transition-colors">
                    Tech Specifications
                  </a>
                </li>
                <li>
                  <a href="/#faq" className="hover:text-emerald-400 transition-colors">
                    FAQ & Discrepancies
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/jadonamite/lading"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                  >
                    Contract Source
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-3">
              <h4 className="label text-slate-400 font-bold">Verification</h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="text-slate-400 mb-1">Contract Address</div>
                  <a
                    href={addrUrl(LADING_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-emerald-400 hover:underline flex items-center gap-1 truncate"
                  >
                    {shortAddr(LADING_ADDRESS)}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>BOT Chain ID {botChain.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Lading Protocol. Non-custodial documentary credit settlement.</p>
          <div className="flex items-center gap-4">
            <span className="mono text-slate-400">47/47 Verification Tests Green</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="text-emerald-400">Zero Admin Custody</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
