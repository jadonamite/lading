"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";


export type AvatarList = {
  image: string;
};

type HeroSectionProps = {
  avatarList: AvatarList[];
};

function HeroSection({ avatarList }: HeroSectionProps) {
  return (
    <section id="hero" className="min-h-[80vh] flex flex-col justify-center">
      <div className="w-full h-full relative">
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-10 h-[34rem] w-[68rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.20),transparent)] blur-3xl" />
            <div className="absolute left-[12%] top-40 h-[26rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)] blur-3xl" />
            <div className="absolute right-[10%] top-24 h-[24rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.10),transparent)] blur-3xl" />
          </div>
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="lg:text-8xl md:text-7xl text-5xl font-medium tracking-tight leading-14 md:leading-20 lg:leading-24"
                >
                  Get paid the moment your documents match, with{" "}
                  <span className="font-serif italic tracking-tight text-emerald-300"><br/>
                    no bank in the middle
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
                  className="text-base font-normal max-w-2xl text-muted-foreground"
                >
                  Lading is a letter of credit that settles itself. The buyer locks
                  the money up front against terms you both agree; the moment you
                  present documents that meet them, the full amount is
                  <span className="text-emerald-300"> yours in the same transaction</span>.
                  If you never do, the buyer is
                  <span className="text-emerald-300"> refunded automatically</span> at
                  expiry. No bank, no release button, nobody&apos;s discretion —
                  including ours.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                className="flex items-center flex-col md:flex-row justify-center gap-8"
              >
                <Link
                  href="/open"
                  className="relative inline-flex items-center text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden bg-primary text-primary-foreground hover:bg-emerald-400 hover:text-emerald-950 hover:shadow-[0_0_30px_-6px_rgba(16,185,129,0.7)]"
                >
                  <span className="relative z-10 transition-all duration-500">
                    Open a credit
                  </span>
                  <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45 group-hover:bg-emerald-950 group-hover:text-emerald-300">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
                <div className="flex items-center sm:gap-7 gap-3">
                  <ul className="avatar flex flex-row items-center" aria-label="What the contract guarantees">
                    {[
                      { src: "/chip-vault.svg", alt: "Funds held with no key that opens them" },
                      { src: "/chip-docs.svg", alt: "Documents examined against the stated terms" },
                      { src: "/chip-scales.svg", alt: "The examination, done without a bank" },
                      { src: "/chip-seal.svg", alt: "The seal struck on an honoured presentation" },
                    ].map((chip, index) => (
                      <li key={index} className="-mr-3 z-1 transition-transform hover:-translate-y-0.5">
                        <img
                          src={chip.src}
                          alt={chip.alt}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full border-2 border-background"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="gap-1 flex flex-col items-start">
                    <p className="text-sm font-medium">Held by code, not by a bank.</p>
                    <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                      No owner, no pause, no release button — read it yourself
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
