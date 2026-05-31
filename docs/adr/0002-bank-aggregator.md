# ADR-0002: Bank aggregator

- Status: Accepted
- Date: 2026-05-18
- Deciders: Andrius

## Context

Centfolio needs to read transactions from the user's bank. In the EU
this means PSD2 — the regulation that lets a third party access
account data with the user's consent. There are two ways to consume
PSD2: integrate with each bank's PSD2 API directly, or go through an
aggregator that has already done that integration on your behalf.

The primary bank for v1 is SEB Lithuania, and the user base is
explicitly Baltic-first. Centfolio reads transactions only and will
never initiate payments, so the relevant scope is PSD2 AIS (account
information), not PIS (payment initiation).

The build effort cost matters disproportionately on a solo evening
project. Every hour spent maintaining bank-specific quirks is an hour
not spent on the match flow or the receipt pipeline, which is where
Centfolio's actual differentiation lives.

## Decision

Centfolio uses GoCardless Bank Account Data (formerly Nordigen) as
its sole bank aggregator. SEB Lithuania is the launch integration;
other Baltic banks will be added through the same provider as the
need arises.

The free tier (10 active end-user connections per month, unlimited
transactions per connection) covers v1 and the invite-only v1.5
window. Centfolio does not call any bank's PSD2 API directly.

## Alternatives considered

**Direct PSD2 integration with SEB Lithuania.** Cuts out the
middleman, no per-connection fee, full control over the data
contract. Rejected because PSD2 implementations are bank-specific:
sandbox onboarding, eIDAS certificate provisioning, and ongoing
contract maintenance are all per-bank work, and SEB's flavor in
particular has known quirks around consent renewal and transaction
field shapes. The first integration alone would consume more evenings
than v1 has budget for.

**Plaid.** The default choice in North America. Rejected because
Plaid's EU coverage is shallow and SEB Lithuania is not supported as
a first-class institution. Plaid is the right answer in a different
geography, not this one.

**TrueLayer or Tink.** Both are credible European aggregators with
solid Baltic coverage. Rejected primarily on pricing: both charge
per-connection on commercial tiers from much lower volumes than
GoCardless does, which matters for a project that may never have
revenue. GoCardless's free tier (acquired from Nordigen) is the
practical differentiator here.

## Consequences

- **Good:** One integration covers SEB Lithuania today and most other
  Baltic banks (Swedbank, Luminor, Citadele) when invite-only expands.
  Adding a bank is a configuration change, not a new module.
- **Good:** The free tier removes the cost pressure to limit the
  invite list artificially in v1.5.
- **Good:** Read-only by construction — there is no code path through
  GoCardless that could initiate a payment. This keeps Centfolio
  cleanly out of PIS scope.
- **Bad:** PSD2 allows consent windows of up to 180 days under SCA
  exemptions, but GoCardless surfaces 90 days because most banks —
  including SEB Lithuania — enforce shorter windows at the institution
  level. Centfolio has to build a reconnect flow and an `expiring`
  connection state (see `CONTEXT.md`); this is unavoidable for any AIS
  solution but worth naming as a real cost.
- **Bad:** Centfolio is dependent on GoCardless's roadmap and pricing.
  If they sunset the free tier or change rate limits, Centfolio
  feels it directly. The sync code is structured around a thin
  adapter at the SDK boundary (per `.claude/rules/testing.md`) so a
  future swap is not a rewrite, but it is real work.
- **Neutral:** Sandbox testing is done through GoCardless's mock bank
  rather than SEB's. Functional, but means the first real-bank sync
  in production is the first time the integration meets the actual
  SEB response shape.

## Amendments

### 2026-05-31, Phase 4 grilling outcome: redaction policy for logging

GoCardless response payloads carry IBANs, debtor / creditor names
(potentially private individuals on P2P transfers, employer names
on salary deposits), and free-text remittance information. The
Phase 4 pipeline enforces a strict allow-list when calling
`logError` from any code path under `src/lib/gocardless/**` or
`src/lib/categorization/**`: internal IDs and failure metadata
are allowed; raw bank-side fields are forbidden, including masked
or hashed forms of the IBAN. The Sentry project additionally has
its built-in IBAN scrubbing pattern enabled as defense-in-depth.
See `.claude/rules/bank-sync.md` and `.claude/rules/categorization.md`
for the full allow-lists.

### 2026-05-31, Phase 4 grilling outcome: booked-only sync

Centfolio syncs **booked** GoCardless transactions only, never
pending. This is a correctness requirement, not just a scope choice:
pending transactions have ephemeral `transactionId` values that can
rotate when the transaction settles, which breaks the unique-index
dedup guarantee on `(userId, bankAccountId, gocardlessTransactionId)`
that the sync runner relies on. Adding pending support later
requires explicit handling of the rotation. See
`.claude/rules/bank-sync.md` for the constraint and the path
forward if it ever earns its keep.

## References

- `PROJECT.md` — Phase 4 (bank sync) success criteria
- `CONTEXT.md`, the `Sync` process, `Bank connection`, `Bank
  account`, `Archived account`, and `Bank connection states`
- `docs/adr/0005-no-historical-backfill.md` — what we deliberately
  don't import from GoCardless
- `.claude/rules/bank-sync.md`, discipline rules captured during
  the Phase 4 grilling session
