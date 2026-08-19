"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, FileCheck2, Lock, Scale, ShieldCheck } from "lucide-react";

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
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="lg:text-8xl md:text-7xl text-5xl font-medium tracking-tight leading-14 md:leading-20 lg:leading-24"
                >
                  The bank never verified the goods. It verified{" "}
                  <span className="font-serif italic tracking-tight"><br/>
                    paperwork against a spec
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
                  className="text-base font-normal max-w-2xl text-muted-foreground"
                >
                  That check is mechanical, which is why it belongs in a contract.
                  Fund a credit and the beneficiary is paid the instant conforming
                  documents are presented. If they never are, you are refunded at
                  expiry. No bank, no release button, nobody&apos;s discretion.
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
                  className="relative inline-flex items-center text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  <span className="relative z-10 transition-all duration-500">
                    Open a credit
                  </span>
                  <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
                <div className="flex items-center sm:gap-7 gap-3">
                  <ul className="avatar flex flex-row items-center" aria-label="What the contract guarantees">
                    {[ShieldCheck, Lock, FileCheck2, Scale].map((Icon, index) => (
                      <li key={index} className="-mr-2 z-1">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-secondary text-foreground">
                          <Icon size={16} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="gap-1 flex flex-col items-start">
                    <p className="text-sm font-medium">No owner. No pause. No upgrade.</p>
                    <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                      47 tests, all green — read the contract yourself
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
