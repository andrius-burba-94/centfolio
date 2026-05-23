# ADR-0005: No historical backfill on bank connection

- Status: Accepted
- Date: 2026-05-18
- Deciders: Andrius

## Context

When a user connects a bank account through GoCardless, the API will
return up to 24 months of past transactions on the initial fetch. The
obvious thing to do is import them, so the dashboard shows useful
history from day one rather than an empty list.

The problem is that imported history arrives without any of the
detail Centfolio is actually built around. Receipts can't be matched
to transactions that happened weeks before Centfolio existed, because
the photos were never taken. Rules can be retroactively applied, but
they were authored against the user's current spending patterns, not
last quarter's. AI categorization on three months of context-free
payee strings produces low-confidence guesses at best.

The result is a dashboard that looks populated but is mostly
half-classified rows that the user has to either manually fix or
quietly ignore. The "calm, considered" framing in `PROJECT.md`
explicitly prefers visibly empty over subtly wrong.

## Decision

Bank sync starts at the moment of consent. Only transactions posted
after the GoCardless consent timestamp flow into Centfolio. The full
24-month historical window the API offers is not imported, even
though it is free to fetch.

Users who want older transactions in Centfolio enter them manually,
the same way they would enter cash purchases.

## Alternatives considered

**Import the full 24-month window automatically.** Rejected as
explained above — looks good, behaves badly, and trains the user to
distrust automatic categorization on the rows that matter (the ones
arriving live).

**Import the window but flag every imported row as `uncategorized`
and pre-AI.** Honest about the data quality, but produces a "Needs
review" list of 200+ rows on day one, which is exactly the kind of
backlog the app's tone is supposed to avoid. Rejected.

**Offer history import as a user-triggered action with a warning.**
Defensible, and the path of least regret for v2. Deferred rather than
rejected — out of scope for v1 to keep the sync flow single-purpose.

## Consequences

- **Good:** Every transaction in Centfolio's history is one the app
  saw arrive live, which means it had a chance to apply rules, attempt
  a confident AI categorization, and offer the receipt-match flow. The
  data is uniformly high-quality from the first row onward.
- **Good:** The sync code path has one job. No "is this the initial
  sync or an incremental sync" branch, no special-case categorization
  for historical rows, no separate review queue for backfill.
- **Bad:** The dashboard is empty for the first weeks of use. Charts
  that need a month of data (spending trends, portfolio history) take
  a month to become interesting. This is a real onboarding cost.
- **Bad:** A user who connects mid-month sees their "this month"
  totals computed from only post-consent transactions. The number
  isn't wrong as a sum, but as an answer to "how much did I spend this
  month" it's misleading until a full calendar month has elapsed.
  Phase 7 will need a UI affordance — likely a hint near the dashboard
  total — that the period is partial.
- **Neutral:** Manual entry remains the escape hatch. Power users can
  type in a handful of large past transactions if they want a
  more-populated starting point; most won't bother, which is fine.

## References

- `PROJECT.md` — Phase 4 success criteria and the "honest data, or no
  data" operating principle
- `CONTEXT.md` — the `Sync` process definition, which encodes this
  decision into the ubiquitous language
- `docs/adr/0002-bank-aggregator.md` — the aggregator choice this
  builds on
