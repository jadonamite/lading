# Deployments

## BOT Chain Mainnet — chain 677 · Aug 22, 2026

| | |
|---|---|
| **Contract** | `0x21FB87b92B125FFD27b3D3319072350Cd8b3703E` |
| **Explorer** | https://scan.botchain.ai/address/0x21fb87b92b125ffd27b3d3319072350cd8b3703e |
| **Deploy tx** | `0xa42e87883826efa09e7fd519ae09e0aba0860f83dc323a9269dfb497c7ae5b18` |
| **Block** | 20,507,658 |
| **Gas used** | 1,933,451 |
| **Source** | **verified** on Blockscout — `Pass - Verified` |
| **Deployer** | `0x40f29Df2c744e526AA59fbD7d3F996BC0BeA7ce2` |
| **Funding** | 1 BOT Gas Support grant |

```
Chain ID  677
RPC       https://rpc.botchain.ai/
Explorer  https://scan.botchain.ai
```

Same bytecode and, by coincidence of a fresh nonce-0 deployer on both chains, the same
address as the Bohr rehearsal below.

## BOT Chain Testnet (Bohr) — chain 968 · Aug 20, 2026 — rehearsal only

Used to prove the escrow invariant on a live chain before spending real gas on mainnet.
Not the submission target.

| | |
|---|---|
| **Contract** | `0x21FB87b92B125FFD27b3D3319072350Cd8b3703E` |
| **Explorer** | https://scan.bohr.life/address/0x21FB87b92B125FFD27b3D3319072350Cd8b3703E |
| **Deploy tx** | `0x2665b830d18a90d8899048603a7b7039f00966a0a0a20f62c49021f3827f89c4` |
| **Block** | 20,470,244 |
| **Gas used** | 1,933,451 |
| **Source** | **verified** on Blockscout — `Pass - Verified` |
| **Deployer** | `0x40f29Df2c744e526AA59fbD7d3F996BC0BeA7ce2` |

```
Chain ID  968
RPC       https://rpc.bohr.life
Explorer  https://scan.bohr.life
Faucet    https://faucet.botchain.ai/basic   (up to 10 tBOT / 24h)
```

### Seeded state — the three demo paths, all live on testnet only

| Credit | Amount | State | Shows |
|---|---|---|---|
| **#1** | 0.5 tBOT | Open, one notice of refusal | quantity presented as 499 against a required 500 — funds unmoved, reason on record |
| **#2** | 1.25 tBOT | **Honoured** | conforming presentation paid in the same transaction |
| **#3** | 0.25 tBOT | Open, short expiry | the refund path, once expiry passes |

Escrow held `0.75 tBOT` immediately after seeding — exactly #1 plus #3, with #2 paid
out. That equality is the invariant `NoAdminKey.t.sol` fuzzes, holding on a live chain.

These credits exist only on chain 968. The mainnet contract above is unseeded — `nextId`
starts at 1, no demo data.

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url botchain --broadcast \
  --verify --verifier blockscout --verifier-url https://scan.botchain.ai/api \
  --private-key $DEPLOYER_KEY
```

The script refuses any chain that is not 677 or 968.
