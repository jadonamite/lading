import { createConfig, http, injected } from "wagmi";
import { botChain } from "./chain";

/// Injected wallet only. A hosted auth provider would put a third party between the user and
/// a contract whose entire claim is that nobody stands between them (FR-010).
export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [injected()],
  transports: { [botChain.id]: http(botChain.rpcUrls.default.http[0]) },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
