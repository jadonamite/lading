"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { botChain, LADING_ADDRESS, addrUrl } from "@/lib/chain";
import { shortAddr } from "@/lib/lading";
import { Button } from "./ui";

export function Header() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const injected = connectors[0];
  const wrongChain = isConnected && chainId !== botChain.id;

  return (
    <header className="border-b rule bg-paper-2/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">Lading</span>
          <span className="hidden text-xs text-ink-3 sm:inline">documentary credit</span>
        </Link>

        <nav className="ml-2 hidden gap-4 text-sm text-ink-2 sm:flex">
          <Link href="/open" className="hover:text-ink">
            Open a credit
          </Link>
          <Link href="/about" className="hover:text-ink">
            How it works
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {LADING_ADDRESS !== "0x0000000000000000000000000000000000000000" ? (
            <a
              href={addrUrl(LADING_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs text-ink-3 hover:text-ink md:inline mono"
              title="The contract, verified on BOT Chain. Read it — that is the point."
            >
              {shortAddr(LADING_ADDRESS)}
            </a>
          ) : null}

          {wrongChain ? (
            <Button onClick={() => switchChain({ chainId: botChain.id })}>
              Switch to BOT Chain
            </Button>
          ) : isConnected ? (
            <button
              onClick={() => disconnect()}
              className="mono rounded-md border rule bg-white px-3 py-1.5 text-xs hover:bg-paper-2"
              title="Disconnect"
            >
              {shortAddr(address)}
            </button>
          ) : (
            <Button disabled={!injected || isPending} onClick={() => injected && connect({ connector: injected })}>
              {isPending ? "Connecting…" : "Connect wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
