"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border rule bg-white/60 p-5", className)}>{children}</section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border rule bg-white px-3 py-2 text-sm mono",
        "outline-none focus:border-seal focus:ring-1 focus:ring-seal",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-md border rule bg-white px-3 py-2 text-sm",
        "outline-none focus:border-seal focus:ring-1 focus:ring-seal",
        props.className,
      )}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary"
          ? "bg-seal text-paper hover:bg-seal-2"
          : "border rule bg-white text-ink hover:bg-paper-2",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b rule py-2 last:border-0">
      <span className="label shrink-0">{k}</span>
      <span className="min-w-0 truncate text-right text-sm">{children}</span>
    </div>
  );
}

/// Every on-chain value is a link to the explorer. The claim this product makes is that you
/// do not have to take its word for anything, so the interface never states a fact without
/// also handing over the means to check it.
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mono underline decoration-rule underline-offset-2 hover:decoration-seal"
    >
      {children}
    </a>
  );
}

export function Badge({ tone, children }: { tone: "open" | "honoured" | "refunded" | "warn"; children: ReactNode }) {
  const tones = {
    open: "bg-paper-2 text-ink-2 border-rule",
    honoured: "bg-seal text-paper border-seal",
    refunded: "bg-white text-ink-3 border-rule",
    warn: "bg-refuse-2 text-refuse border-refuse",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-widest",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-3">{children}</p>;
}
