import { defineChain } from "viem";

/// Read from the chain's own RPC on Aug 19, 2026 — see docs/CHAIN.md.
export const botChain = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    // The trailing slash is required — the bare host returns nothing.
    default: { http: ["https://rpc.botchain.ai/"] },
  },
  blockExplorers: {
    default: { name: "BOT Scan", url: "https://scan.botchain.ai" },
  },
});

/// The real USDT on this chain: 289,324 holders, verified source, standard bool-returning
/// ERC-20, no fee-on-transfer, no blacklist, no pause. **Six decimals, not eighteen.**
export const USDT = "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as const;

export const LADING_ADDRESS = (process.env.NEXT_PUBLIC_LADING_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const txUrl = (hash: string) => `${botChain.blockExplorers.default.url}/tx/${hash}`;
export const addrUrl = (a: string) => `${botChain.blockExplorers.default.url}/address/${a}`;
