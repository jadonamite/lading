# Lading

**A documentary credit, settled by contract.** The applicant funds it; the beneficiary is paid
the instant documents matching a pre-agreed specification are presented; the applicant is
refunded in full if they never are.

Built for the BOT Chain Builder Challenge #2 — RWA track.

- **Live product:** [lading.namite.xyz](https://lading.namite.xyz)
- **Contract on BOT Chain mainnet:** [`0x21FB87b9...3703E`](https://scan.botchain.ai/address/0x21fb87b92b125ffd27b3d3319072350cd8b3703e) — verified
- **Chain:** BOT Chain, id 677 · [scan.botchain.ai](https://scan.botchain.ai)

---

## The precedent

A seller in one country will not ship to a buyer they have never met; the buyer will not pay
first. The documentary credit resolved that standoff four hundred years ago by putting a bank
in the middle — one that undertakes to pay the seller not when the goods arrive, but when the
*paperwork* arrives and matches what was agreed.

The rules are **UCP 600**, published by the International Chamber of Commerce and in force
since 2007. The insight that makes it work is a strange one: **the bank never verifies the
goods.** It verifies documents against a specification, mechanically, and pays or refuses on
that basis alone.

A mechanical check is exactly what a contract does well. What genuinely needed a bank was
custody of the money in between — and custody is the one thing a settlement layer provides for
free.

## Why this cannot be a Postgres table

It could, right up until the money matters.

The instrument's entire value is that the beneficiary can ship goods *before* being paid,
against an undertaking that the buyer cannot revoke and the intermediary cannot be persuaded
to break. In a database, the undertaking is a row someone with write access can update. The
seller is not trusting the terms; they are trusting whoever runs the server, which is exactly
the position the letter of credit was invented to escape.

So the test of a real implementation is not that it has a smart contract. It is whether the
operator can move the money. Here they cannot:

**There is no administrator.** No owner, no role, no pause, no upgrade path, no
`selfdestruct`, no `receive`, no `fallback`. Funded value leaves through exactly two
functions — an honoured presentation and a refund after expiry — and neither consults any
address's discretion, including the deployer's. The deploying key holds gas and nothing else.

That claim is verifiable in two ways, both of them cheap: read the verified source on the
explorer, or run `test/NoAdminKey.t.sol`, which fuzzes every external function from every
address across every state and asserts the escrow balance only ever changes by the exact face
amount, through those two paths.

## What it does not claim

The chain proves the bytes presented matched the bytes agreed, and that the stated values
satisfied the stated bounds. **It does not prove the goods exist, that they shipped, or that
the document is truthful.**

That gap is not an oversight. It is the same gap UCP 600 runs on by design — which is why a
real credit names an inspection body when the gap matters, and why this contract lets the
applicant nominate any address as a presenter, an inspector included. Any product claiming to
have closed that gap from a browser is lying to you.

## How it works

| Step | What happens |
|---|---|
| **Open** | The applicant states beneficiary, nominated presenters, asset, face amount, expiry, the required document hash, and up to 16 conditions. Funds move in with the terms. From that instant the applicant cannot reach them either. |
| **Present** | A nominated presenter supplies the document and its stated values. The contract checks the document hash, then walks the conditions in order. Conforming means **paid, in the same transaction**. |
| **Refuse** | A non-conforming presentation **does not revert**. It records a notice naming the failed condition, its bound, and what was presented; the credit stays open and the money never moved. UCP 600 art. 16 requires a refusing bank to state each discrepancy — and a revert would record nothing at all. |
| **Amend** | Terms change only once applicant **and** beneficiary have signed the identical amendment (art. 10). One signature does nothing. Superseded terms stay readable. |
| **Expire** | After expiry an unhonoured credit refunds the applicant in full. Anyone may trigger it, because the funds can only route to one address. |

Conditions are not equality-only: `EQ`, `LTE` and `GTE` are all supported, because *"latest
shipment date on or before the 22nd"* is most of what a real presentation is made of.

## Design notes

**The dry-run.** `conforms()` is a `view` that returns the same finding `present()` would
produce. The interface calls it as you type, so a party sees the discrepancy — named field,
bound, presented value — **before** deciding to spend gas. A trade document gets re-cut and
re-presented all the time; making that loop free is the difference between an instrument and a
slot machine.

**Decimals are never converted.** The contract holds and moves `uint256` in the asset's own
base unit and never reads `decimals()`. All display scaling lives in one frontend file, and
every call passes the token's own reported decimals — there is no default to fall back to.
The live USDT on this chain has **6** decimals, not 18, and an 18-decimal assumption is the
kind of bug that fails silently while the logs stay clean.

**The asset is a parameter.** `address(0)` means native BOT, funded by `msg.value`; anything
else is an ERC-20 pulled with `safeTransferFrom`. Credits settle in the chain's real
[USDT](https://scan.botchain.ai/address/0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C) —
289,324 holders, verified source — rather than a mock token.

**No backend and no indexer.** The interface reads contract state and logs directly. An
off-chain service in the honour path would be a dependency you can see and a liability the
moment it goes down.

## Running it

```bash
# contracts — 47 tests
cd contracts
forge test

# deploy (chain 677; the script refuses to run anywhere else)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url botchain --broadcast \
  --verify --verifier blockscout --verifier-url https://scan.botchain.ai/api \
  --private-key $DEPLOYER_KEY

# the product
cd app
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_LADING_ADDRESS
npm run dev
```

Dependencies are pinned as submodules — `git clone --recursive`, or `git submodule update
--init` in an existing clone.

## Tests

47, all green.

| File | Covers |
|---|---|
| `Lading.t.sol` | the seven acceptance scenarios, one test each — conformity, nomination, expiry as an absolute, double-payment, unknown credits |
| `Decimals.t.sol` | an exact 6-decimal face amount arriving as exactly `12500000`, asserted on the token rather than on an event, plus a fuzzed round-trip |
| `NoAdminKey.t.sol` | the escrow invariant under fuzzed calls from arbitrary addresses; that the deployer has no standing; that bare native value is refused |
| `Attacks.t.sol` | reentrancy on a native honour, replay of an honoured presentation, cross-credit replay |
| `Amendment.t.sol` | one signature changes nothing; both apply; consent does not carry across amendments; the hash is bound to this deployment |

## Licence

MIT.
