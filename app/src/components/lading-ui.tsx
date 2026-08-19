"use client";

import { cn } from "@/lib/cn";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80",
        className
      )}
    >
      {children}
    </section>
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
    <label className="block space-y-1.5">
      <span className="label text-slate-400 font-semibold tracking-wider">{label}</span>
      <div>{children}</div>
      {hint ? <p className="text-xs text-slate-400 leading-relaxed">{hint}</p> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm mono text-slate-100 placeholder-slate-500",
        "outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100",
        "outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
        props.className
      )}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-medium rounded-lg",
    md: "px-5 py-2.5 text-sm font-semibold rounded-xl",
    lg: "px-6 py-3 text-base font-semibold rounded-xl",
  };

  const variantClasses = {
    primary:
      "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 shadow-md active:scale-[0.98]",
    ghost:
      "border border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 active:scale-[0.98]",
    danger:
      "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 shadow-lg shadow-rose-500/10 active:scale-[0.98]",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
        sizeClasses[size],
        variantClasses[variant],
        props.className
      )}
    >
      {children}
    </button>
  );
}

export function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/80 py-2.5 last:border-0">
      <span className="label text-slate-400 shrink-0">{k}</span>
      <span className="min-w-0 truncate text-right text-sm text-slate-200">{children}</span>
    </div>
  );
}

export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mono inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-400 transition-colors"
    >
      {children}
      <ExternalLink className="h-3 w-3 inline shrink-0 opacity-70" />
    </a>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "open" | "honoured" | "refunded" | "warn";
  children: ReactNode;
}) {
  const tones = {
    open: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10",
    honoured: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10",
    refunded: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    warn: "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose-500/10",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
        tones[tone]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "open" && "bg-amber-400 animate-pulse",
          tone === "honoured" && "bg-emerald-400",
          tone === "refunded" && "bg-slate-400",
          tone === "warn" && "bg-rose-400"
        )}
      />
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-slate-400 font-medium">{children}</p>;
}

