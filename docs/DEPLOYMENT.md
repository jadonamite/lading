# Deployments

## BOT Chain Testnet (Bohr) — chain 968 · Aug 20, 2026

| | |
|---|---|
| **Contract** | `0x21FB87b92B125FFD27b3D3319072350Cd8b3703E` |
| **Explorer** | https://scan.bohr.life/address/0x21FB87b92B125FFD27b3D3319072350Cd8b3703E |
| **Deploy tx** | `0x2665b830d18a90d8899048603a7b7039f00966a0a0a20f62c49021f3827f89c4` |
| **Block** | 20,470,244 |
| **Gas used** | 1,933,451 |
| **Source** | **verified** on Blockscout — `Pass - Verified` |
| **Deployer** | `0x40f29Df2c744e526AA59fbD7d3F996BC0BeA7ce2` |

Network parameters, which are **not** discoverable under `botchain.ai` — the testnet
lives on its own domain, and probing `testnet-rpc.botchain.ai` and friends returns nothing:

```
Chain ID  968
RPC       https://rpc.bohr.life
Explorer  https://scan.bohr.life
Faucet    https://faucet.botchain.ai/basic   (up to 10 tBOT / 24h)
```

### Seeded state — the three demo paths, all live

| Credit | Amount | State | Shows |
|---|---|---|---|
| **#1** | 0.5 tBOT | Open, one notice of refusal | quantity presented as 499 against a required 500 — funds unmoved, reason on record |
| **#2** | 1.25 tBOT | **Honoured** | conforming presentation paid in the same transaction |
| **#3** | 0.25 tBOT | Open, short expiry | the refund path, once expiry passes |

Escrow held `0.75 tBOT` immediately after seeding — exactly #1 plus #3, with #2 paid
out. That equality is the invariant `NoAdminKey.t.sol` fuzzes, holding on a live chain.

## BOT Chain Mainnet — chain 677

**Not yet deployed.** Blocked on gas: the deployer holds 0 BOT, the official bridge has
reported *"cross-chain transfers temporarily unavailable"* since Aug 19 with its
BOT-for-gas option reading zero, and BOT is not listed on any exchange found. The Gas
Support grant (1 BOT) is the outstanding route.

Deployment needs **~0.039 BOT** at the chain's flat 20 gwei — measured, not estimated:
the testnet deploy above used 1,933,451 gas, and mainnet is the same bytecode.

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url botchain --broadcast \
  --verify --verifier blockscout --verifier-url https://scan.botchain.ai/api \
  --private-key $DEPLOYER_KEY
```

The script refuses any chain that is not 677 or 968.
