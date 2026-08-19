# BOT Chain Builder Challenge #2 — the rules, read at source

Read from the organiser's own Notion handbook and Luma page, **Aug 19, 2026**.

| | |
|---|---|
| Registration | https://luma.com/238et7cw |
| Handbook | https://app.notion.com/p/BOT-Chain-Builder-Challenge-2-3b246f6c38d5803495bac38b8c078690 |
| Builder Hub (support) | https://t.me/BotChain_official/61 |
| **Gas Support form** | https://forms.gle/QGWNnmthCDgL92uR9 |
| **Project Submission form** | https://forms.gle/ZKvnfcGrkZmdgigA8 |
| Prize pool | **up to 5,000 USDT** — quality-first, tiers may be left vacant and rolled over |
| Track | **RWA Applications** (stated highest priority in review) |
| Gas support | **1 BOT per qualifying project**, by form |

## Hard eligibility gates — all required to reach final review

| Requirement | Lading's answer |
|---|---|
| **BOT Chain Mainnet deployment** — testnet-only is not judged at all | T025 |
| Publicly verifiable product form, **complete user/business loop** (consumer-ready) | S1 open → present → paid, and expire → refund |
| **Wallet connection** completing the core business flow | wagmi injected wallet, chain 677 auto-add |
| Publicly accessible website / online demo | Vercel (T032) |
| GitHub repository | need not be *public*, but judges must have access |
| Originality — no renamed or partially adjusted prior entry | new contract, written for this |
| Demo video | *recommended*, not required (T045 — we do it anyway) |

**No submission tag, template or identifier is required.** T043 is answered: there is nothing
to carry. *(Checked against both forms and the handbook, Aug 19.)*

## Scoring weights — where the marks actually are

| Dimension | Weight |
|---|---|
| Product completion | **30%** |
| BOT Chain mainnet integration & deployment quality | **25%** |
| Innovation | 20% |
| User experience | 15% |
| Technical quality | 10% |

RWA track is judged additionally on **authenticity of assets, business-loop completeness,
compliance feasibility**.

**Read this table as a build instruction.** 55% of the score is product completion plus
deployment quality — *not* contract cleverness, which is the 10% row. The 47 tests are table
stakes; the frontend and the live mainnet flow are where this is won. Settling in the chain's
real 289k-holder USDT rather than a mock token is the cheapest available point on
"authenticity of assets" and on deployment quality both.

## Rules that could disqualify

- A project already deployed to BOT Chain mainnet may not enter. Lading has never touched
  this chain — clean.
- No resubmission of the same project across periods; no renaming or partial adjustment of a
  prior entry. Lading is new code; FundX-Celo is a shape reference, not a parent — and its
  owner-release admin key is the thing this contract exists to abolish.
- **AI tools are explicitly permitted during development** ("Absolutely. We encourage
  developers to use AI tools"). This does not change the house rule: no AI watermark in
  commits, README, or submission text.
- Prizes are paid in USDT after **wallet verification** — the payee wallet must be one Jadon
  controls, not the throwaway deployer.

## Dates

| Date | What |
|---|---|
| **Aug 22** | Submission deadline (form) |
| Aug 24 | Online demo day — selected projects present |

## Still open

- **Testnet existence** — the gas form has an *optional* "Testnet contract / transaction
  link" field, which implies one exists but is not required. Not on the critical path: the
  event only judges mainnet. Ask in the Builder Hub.
- **Second RPC endpoint** — none published. Single point of failure on deploy day.
