# BOT Chain — facts read at source

Every row below was read from the chain's own RPC or its Blockscout API. No aggregator.
Re-read before each deploy: these rot.

## Read Aug 19, 2026 (pre-deploy re-verification)

| Fact | Value | Call |
|---|---|---|
| Chain ID | **677** (`0x2a5`) | `eth_chainId` |
| RPC | `https://rpc.botchain.ai/` | responded; **trailing slash required** |
| Head block | 20,169,915 (`0x133c4bb`) | `eth_blockNumber` |
| Gas price | **20 gwei** (`0x4a817c800`) | `eth_gasPrice` |
| Explorer | `https://scan.botchain.ai` — Blockscout | `/api/v2/*` answers in v2 shape |
| Native token | **BOT**, $9.63, avg block 669 ms | `/api/v2/stats` |
| Network size | 20.16 M blocks · 15.46 M txs · 1.28 M addresses · 127 k txs today | `/api/v2/stats` |
| Source verification | **live and in daily use** — 713 verified of 1,532 contracts; **21 verified in the preceding 24 h** | `/api/v2/smart-contracts/counters` |
| USDT | `0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C` | — |
| USDT `symbol()` | `USDT` | `eth_call 0x95d89b41` |
| USDT `decimals()` | **6** | `eth_call 0x313ce567` |

**No drift from the Aug 18 reading.** Verification throughput moved 47 → 21 per 24 h and the
verified count 696 → 713; the deploy-and-verify path is confirmed active either way.

### The 6-decimal trap — confirmed live, not assumed

`decimals()` returned `6` from the live token contract, not from a doc page. This is the
Governor `TST` failure mode (an 18-decimal assumption made every amount 1e12 too small and
failed *silently* — clean logs, an agent doing nothing for ten days). Mitigation here is
structural rather than vigilant: `Lading.sol` never converts decimals at all — it holds and
moves the asset's own base unit — and `test/Decimals.t.sol` asserts an exact 6-decimal amount
end to end on the token itself, not on an event.

### Field intelligence (Aug 18, unchanged)

The token list carries `USDT1`…`USDT6`, `Test USDC`, `Mock USDC`, `PulseGrid Mock USD` —
competing entrants are deploying **mock** tokens. Settling in the real 289,324-holder USDT is
a free, visible differentiator on the RWA track.

### Open

- **Testnet existence** — still unconfirmed. Deliberately off the critical path; ask in the
  builder Telegram (T003).
- **Second RPC endpoint** — none known. A single RPC is a single point of failure on deploy
  day; ask in Telegram.
