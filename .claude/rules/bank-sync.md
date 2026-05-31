---
paths:
  - "src/lib/gocardless/**"
  - "src/lib/bankSync/**"
  - "src/app/(app)/settings/banks/**"
  - "src/app/api/gocardless/**"
  - "scripts/sync-*"
  - "pocketbase/pb_migrations/*bank*"
  - "pocketbase/pb_migrations/*transactions*"
  - "tests/fixtures/gocardless/**"
  - "tests/e2e/bank-*.spec.ts"
  - "docs/adr/0002-bank-aggregator.md"
---

# Bank sync

Captures the rules earned during the Phase 4 grilling session. None
of these are obvious from reading the code alone; each prevents a
specific failure mode that has been thought through.

## Redaction policy for `logError`

Bank responses carry IBANs, debtor/creditor names (potentially
private individuals on P2P transfers, employer names on salary
deposits), and free-text remittance information that often
contains invoice numbers and personal names. `logError(err, ctx)`
in production lands in journalctl on the VPS and in Sentry as
structured events; either surface leaking those fields is real
PII exposure.

The pipeline enforces a **whitelist**, not a blacklist. The
helper `scrubGcContext(ctx)` in `src/lib/gocardless/log.ts`
accepts an unscrubbed context object and returns a new object
containing **only** the explicitly-allowed keys; everything else
is dropped silently.

**Allowed in `ctx` for any `logError` in the GC pipeline:**

- Our internal IDs: `userId`, `bankConnectionId`, `bankAccountId`,
  PB `transactionId`
- `gocardlessTransactionId` (opaque, not directly PII; useful for
  GC support cases)
- HTTP status code, GC error code (e.g., `"insufficient_permissions"`)
- Failure category (`"timeout"` | `"http5xx"` | `"parse"` | `"validation"`)
- Error class name and a sanitized error message
- `trigger` (`"cron"` | `"manual"`)
- Timestamps

**Forbidden (must never reach `logError`, even in passing through `ctx`):**

- `iban`: never logged, never masked, never hashed. Internal
  `bankAccountId` is the identifier we use in logs.
- `creditorName`, `debtorName`: third-party PII, potentially
  private individuals.
- `remittanceInformationUnstructured`, `remittanceInformationStructured`:
  free text, often contains invoice references and personal names.
- `balances[].balanceAmount`: financial state. Currently deferred,
  but the rule applies the moment balance ever ships.
- Full GoCardless response objects pasted into `ctx`.

Every `logError` call in `src/lib/gocardless/**` and
`scripts/sync-*.ts` must pass its context through `scrubGcContext`
first. Convention enforces this; reviewers reject direct
`logError(err, { iban: ... })` calls.

**Sentry defense-in-depth:** the Sentry project additionally has
its built-in IBAN scrubbing pattern enabled, so a whitelist
escape (a bug, a new code path that forgot to call
`scrubGcContext`) still catches at the upload boundary. This is
configured once per environment in the Sentry UI, captured as a
pre-work item.

The mirror policy for Gemini categorization calls lives in
`.claude/rules/categorization.md`; the prompt body and the
transaction payees in it are forbidden context too.

## Live-sandbox conformance run gates every release

Bank integration code never ships without at least one **manual
conformance run against live GoCardless sandbox** that exercises
the full pipeline end-to-end: initial connect via OAuth, accounts
listing, transactions fetch, sync runner write, rule + AI
categorization, and (where applicable) the Disconnect / Reconnect
soft-archive flow.

This rule lives at the file-system level because the consequences
of a missed shape mismatch are silent transaction loss. CI fixtures
test the pipeline deterministically; only real GoCardless tells us
whether the parser actually matches the shape SEB returns through
GC.

The conformance run is a pre-sign-off gate for:

- Phase 4 (initial integration; required before PR 5 sign-off).
- Any future PR that touches `src/lib/gocardless/sdk.ts`,
  `src/lib/gocardless/map.ts`, or the `runSyncForUser` shape.
- Any PR that adds a new bank or aggregator (a Swedbank addition,
  a hypothetical Plaid migration, etc.) within the existing
  pipeline.

Document the conformance-run outcome in the merging PR's
description: "Sandbox conformance: N transactions synced cleanly,
M categorized by rule, K by AI, J in needs-review, no errors."
PRs that change the integration surface without a conformance
record are blocked at review.

The CI-fixture infrastructure plus the real-sandbox conformance
gate together are what "tested" means for this code; neither alone
is sufficient.

## Booked transactions only, never pending

GoCardless emits transactions in two states: **booked** (settled,
permanent) and **pending** (provisional, may change before posting).
Centfolio syncs **booked only**.

This is a correctness requirement, not just a scope decision.
Pending transactions have **ephemeral identifiers**: GoCardless can
emit a pending transaction with one `transactionId`, then re-emit
the same purchase as a booked transaction with a **different**
`transactionId` once it settles. The unique-index dedup guarantee
on `(userId, bankAccountId, gocardlessTransactionId)` does not hold
across that rotation; a naive sync would create one row in pending
state and another in booked state for the same purchase.

Anyone adding pending support later must:

1. Capture the rotation explicitly. The GoCardless response groups
   pending and booked separately; match a settling pending against
   its booked counterpart by `(date, amountCents, creditorName)` or
   the bank's own internal reference if present.
2. Treat pending rows as soft, not as first-class transactions. They
   should not appear in budgets or matched-against-receipt flows
   until they settle.
3. Update ADR-0002's amendment to describe the rotation handling
   that lets the unique-index dedup still hold.

The Phase 4 sync runner filters the GoCardless response to booked
status before any write happens.

## Idempotent sync without a lock

Concurrent runs (cron tick + a user clicking the manual `Sync now`
button at the same moment) are explicitly allowed. The shape:

1. The transactions collection carries a partial unique index:
   `CREATE UNIQUE INDEX idx_transactions_external ON transactions
   (userId, bankAccountId, gocardlessTransactionId) WHERE
   gocardlessTransactionId != ''`. The `WHERE` clause is what lets
   Phase 2's manual transactions (no GC id) coexist without
   conflicting with each other.
2. The sync runner does a try-create; on unique-constraint violation
   it reads the existing row and updates it instead (double-checked
   read). Loser of the race is harmless.

Never introduce an advisory lock, a "sync running" flag on the user
or bankConnection row, or any other lockout pattern. The unique
index is the safety net.

**Sequencing constraint:** the migration that adds
`gocardlessTransactionId` to the transactions collection MUST also
add the partial unique index above, in the same migration file. The
two cannot be split across migrations. If the column lands first and
a sync runs before the index is in place, duplicate rows can be
written; the later CREATE UNIQUE INDEX migration then fails to
apply because the constraint is violated by the data already there.
Always pair the field-add and index-add in one migration.

## Stale-account preservation

After a Reconnect (the recovery flow when a 90-day consent expires),
the **old `bankAccount` rows are NOT deleted**. They get
`archivedAt = now()` and their transactions stay attached. Per
ADR-0005 we do not backfill, so old transactions are real history;
they remain queryable and remain candidates for Phase 5 matching.
The new connection creates fresh `bankAccount` rows that future
syncs flow into.

## Disconnect is soft archive, never hard delete

User-initiated Disconnect uses the same soft-archive mechanism as
post-expiry Reconnect: set `archivedAt = now()` on the
`bankConnection` and its `bankAccount` rows. Sync stops because
`runSyncForUser` walks only non-archived rows. Transactions stay
attached.

The UI uses Phase 2's undo-toast pattern (Sonner with a 5-second
Undo affordance, identical to transaction delete). Within the
window, Undo clears `archivedAt`. Beyond the window, the
connection is dead from the user's perspective; recovery is a
fresh OAuth flow, indistinguishable from natural-expiry Reconnect.

The modal-exception path was explicitly considered and rejected.
DESIGN.md's "modal as first thought" ban survives; Centfolio has
no surface that genuinely needs an irreversible-destructive modal
because every destructive action so far is either undo-shaped
(transaction delete, receipt delete, disconnect) or soft-archived
(bank connection rotation). If a future surface ever needs the
exception, it requires its own grilling and a DESIGN.md amendment.

## Run runner is shared, entry points are not

`src/lib/gocardless/run.ts` exports a single function,
`runSyncForUser(userId, options)`, that:

- Iterates the user's active bank connections (non-archived
  bankAccount rows)
- Fetches booked transactions from GoCardless per account
- Idempotently writes them per the unique-index pattern above
- Runs rules-first then AI categorization on each new row
- Returns a structured result the caller can render or log

Two entry points share this function, each with its own retry
policy via the required `trigger` option:

1. `scripts/sync-daily.ts` (OS cron at 02:00 Vilnius time) iterates
   all users with at least one active connection and calls
   `runSyncForUser(userId, { trigger: 'cron' })`. Cron is
   unattended and patient: transient GoCardless errors retry with
   exponential backoff up to roughly 5.5 minutes per account
   (delays: 0s, 5s, 30s, 300s). Reads PB admin creds from
   `.env.local` (same pattern as `scripts/seed.ts`).
2. Server action `syncNowAction()` resolves the current user from
   the session and calls `runSyncForUser(currentUser.id,
   { trigger: 'manual' })`. Manual is attended and impatient:
   single attempt, no retries. A transient failure surfaces to the
   user within ~1-2s; they can re-click rather than waiting
   minutes on a hidden backoff.

The retry schedule lives as a constants table keyed by trigger in
`src/lib/gocardless/sdk.ts`. Never hardcode the delays at the call
site; never share one schedule across both triggers. The
trigger field doubles as `logError` context, so structured-error
output indicates whether an error came from cron or a user click.

No HTTP route is exposed for cron. The OS cron entry runs
`scripts/sync-daily.ts` via `tsx`, identical in shape to the seed
script.
