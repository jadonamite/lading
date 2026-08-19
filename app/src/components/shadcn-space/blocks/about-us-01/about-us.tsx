"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/// The instrument, stated as a lattice of counts.
///
/// Laid out as a ruled grid with most cells left empty, one struck out, and a
/// single cell brought forward — the eye is meant to land on the figure that
/// carries the product, which is the zero. Everything here can be checked by
/// cloning the repo and running `forge test`; there are no users or volumes to
/// report and none are implied.

type Cell = {
  index: string;
  title: string;
  value: string;
  note?: string;
  featured?: boolean;
  hatched?: boolean;
  empty?: boolean;
};

const CELLS: Cell[] = [
  { index: "", title: "", value: "", empty: true },
  { index: "01", title: "Lines of\ncontract", value: "470" },
  { index: "02", title: "Conditions\nper credit", value: "16", note: "maximum" },
  { index: "", title: "", value: "", empty: true },

  { index: "03", title: "Tests,\nall passing", value: "47" },
  { index: "04", title: "Fuzz runs on\nthe invariant", value: "1024", hatched: true },
  {
    index: "05",
    title: "Administrative\nfunctions",
    value: "0",
    note: "no owner · no pause · no upgrade",
    featured: true,
  },
  { index: "06", title: "Ways value\ncan leave", value: "2" },

  { index: "", title: "", value: "", empty: true },
  { index: "07", title: "Decimals,\nnever rescaled", value: "6", hatched: true },
  { index: "08", title: "Backends in\nthe honour path", value: "0" },
  { index: "", title: "", value: "", empty: true },
];

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const numeric = Number(value);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 40, stiffness: 90 });

  useEffect(() => {
    if (inView) mv.set(numeric);
  }, [inView, numeric, mv]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = String(Math.round(latest));
      }),
    [spring],
  );

  return <span ref={ref}>0</span>;
}

function GridCell({ cell }: { cell: Cell }) {
  if (cell.empty) {
    return <div className="border-r border-b border-white/[0.06] min-h-[9rem]" />;
  }

  return (
    <div
      className={cn(
        "relative border-r border-b border-white/[0.06] min-h-[9rem] p-5 sm:p-6 flex flex-col justify-between",
        cell.hatched &&
          "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_7px)]",
        cell.featured && "z-10",
      )}
    >
      {cell.featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border-2 border-emerald-500/70 bg-emerald-500/[0.04]"
        />
      ) : null}

      <div className="relative">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60">
          {cell.index}
        </span>
        <p
          className={cn(
            "mt-3 whitespace-pre-line text-lg leading-tight tracking-tight sm:text-xl",
            cell.featured ? "text-white" : "text-foreground/85",
          )}
        >
          {cell.title}
        </p>
      </div>

      <div className="relative mt-6">
        <span
          className={cn(
            "block text-4xl font-medium tabular-nums sm:text-5xl",
            cell.featured ? "text-emerald-400" : "text-muted-foreground/45",
          )}
        >
          <Counter value={cell.value} />
        </span>
        {cell.note ? (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            {cell.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const AboutUs = () => {
  return (
    <section id="performance" className="relative overflow-hidden">
      {/* Faint contour wash, so the lattice sits on something rather than on flat black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 70% 20%, rgba(16,185,129,0.10), transparent), radial-gradient(40rem 24rem at 15% 80%, rgba(56,189,248,0.08), transparent)",
        }}
      />

      <div className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-emerald-500/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                The instrument
              </span>
              <span className="h-px w-10 bg-emerald-500/60" />
            </div>
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Four hundred years old, rebuilt so custody needs no bank and the
              examination needs{" "}
              <span className="font-serif italic tracking-tight">no clerk</span>
            </h2>
            <p className="text-base font-normal text-muted-foreground">
              Every figure below is checkable. Clone the repository and run the
              suite — there is nothing here you have to take on trust.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 grid grid-cols-2 border-l border-t border-white/[0.06] md:grid-cols-4"
          >
            {CELLS.map((cell, i) => (
              <GridCell key={i} cell={cell} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
