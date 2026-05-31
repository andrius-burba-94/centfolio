# Phase 4, Bank sync and AI categorization

- Status: Draft, awaiting approval
- Date: 2026-05-31
- Owner: Andrius
- Prerequisites: Phase 3 shipped (CHANGELOG.md records 2026-05-31).
  Phase 3 retrospective (docs/retrospectives/phase-3.md, PR #38)
  carry-forwards inherited explicitly: Zod as source of truth, SDK-
  boundary file pattern for external services, errors-as-data
  across Suspense, per-row plus account-level rate limits, no
  required:true on PB number fields that can be zero, normalize
  PB dates at the record converter, live testing as the validation
  surface.

## Goal

SEB Lithuania transactions flow into Centfolio automatically and
get categorized without daily user intervention. The user connects
their bank once, sees their transactions appear within 24 hours,
and finds at least 80% of them categorized by some combination of
user-defined rules and AI suggestions. The remaining are surfaced
in a Needs review list with one-click acceptance for AI proposals
the model wasn't confident enough to apply automatically.

The wedge for Phase 5 (the match) becomes accessible here: synced
transactions land in the same `transactions` collection as Phase
2's manual entries, and Phase 5 will match them against Phase 3's
receipts.

Success criteria per PROJECT.md: every transaction posted to the
SEB account appears in Centfolio within 24 hours with no duplicates
for 30 days; at least 80% of synced transactions are categorized
automatically.

## What's in scope

- GoCardless Bank Account Data integration via the official API,
  free tier. SEB Lithuania first; the schema accommodates other
  Baltic banks (Swedbank, Luminor, Citadele) without re-engineering
  but the v1 UI exposes one institution.
- Two new domain entities per the Phase 4 grilling session:
  `bankConnection` (one per requisition, owns consent expiry +
  status) and `bankAccount` (one or more per connection, owns the
  GoCardless account identifier and IBAN). CONTEXT.md amended with
  both entries plus the `Archived account` definition for the
  Reconnect lifecycle.
- One active bank connection per user in Phase 4. The schema
  supports many; the UI exposes one. Multi-bank ships later when
  it earns its keep.
- Initial connect flow: OAuth via GoCardless requisition with a
  signed HMAC-SHA256 cookie carrying `{requisitionId, csrfToken,
  userId, createdAt}`, set pre-redirect and validated on callback.
  No public HTTP route for cron; the cron script reads PB admin
  creds directly. Cookie helpers ship in `src/lib/auth/signed-
  cookie.ts`.
- Daily sync via OS cron at 02:00 Vilnius time. The cron entry
  runs `scripts/sync-daily.ts` via `tsx`, identical in shape to
  the seed script. Manual `Sync now` button on the settings card
  calls a server action that invokes the same `runSyncForUser`
  module with `trigger: 'manual'`.
- Idempotent sync without a lock: partial unique index on
  `(userId, bankAccountId, gocardlessTransactionId)` where the
  GC id is non-empty, paired with a try-create + double-checked-
  read fallback in the runner. Concurrent cron and manual syncs
  are explicitly allowed.
- Sync runs **booked** transactions only. Pending is correctness-
  forbidden until someone explicitly handles the ephemeral-id
  rotation; ADR-0002 amended and `.claude/rules/bank-sync.md`
  captures the constraint.
- Rule engine: substring case-insensitive payee matching,
  longest-pattern-wins disambiguation. Rule creation triggers a
  proactive recategorization scan over the user's uncategorized
  AND `categorizationSource = 'ai'` transactions, skipping
  `'manual'` and `'ai-reviewed'` rows.
- AI categorization: one batched Gemini call per sync run for
  unmatched transactions, chunked at 50 per call sequential. Prompt
  sends the user's category list as printed names with parent path;
  response carries suggestion-by-index with confidence. Apply loop
  is defensively index-keyed (Gemini can return fewer or reordered
  entries). Confidence >= 0.85 applies silently; below threshold
  stores the suggestion for review. Stale-retry after 30 days.
- Needs review surface: filter param on `/transactions` plus a
  count card on the dashboard. AI-suggestion inline with one-click
  Accept on every row that has one, regardless of filter.
- Disconnect lives as soft archive plus Phase 2-style undo-toast
  (5-second Undo window). Beyond the window, recovery is a fresh
  OAuth flow, same as post-expiry Reconnect.
- Reconnect (recovery-only). When status is `expired` or `error`,
  the connection card surfaces a Reconnect button that flows a
  fresh OAuth round-trip. Old `bankAccount` rows are preserved
  with `archivedAt` set; their transactions stay attached and
  remain queryable for Phase 5's match.
- `logError` redaction whitelist for the GC and Gemini pipelines.
  IBANs, debtor/creditor names, remittance text, balances, and
  raw GC response objects never reach `logError` or Sentry.
  Sentry's built-in IBAN scrubber is enabled as defense-in-depth.
- Four E2E specs covering the locked surface, intercepting both
  GoCardless and Gemini at the SDK boundary via fixture files
  (mirror of Phase 3's `E2E_GEMINI_FIXTURE_FILE`, scaled to a
  directory `E2E_GOCARDLESS_FIXTURE_DIR` because Phase 4 has
  multiple GC call shapes per flow).

## What's deferred

- **`expiring`-state detection and the 7-day banner.** The status
  state machine already enumerates it; Phase 4 ships without an
  active surface or detection cron. Future PR adds the once-daily
  cron tick that walks `bankConnection` rows whose
  `requisitionValidTo` is within 7 days and transitions status to
  `expiring`. UI banner follows.
- **Continuous re-consent with account-ID IBAN-bridging.** Phase 4
  ships recovery-only Reconnect; the IBAN-bridge that preserves
  per-account continuity through a re-consent is genuinely
  untestable against GoCardless sandbox and gets built when real
  v1.5 users hit day 90 in volume.
- **Multi-bank UI.** The schema accommodates it; the UI doesn't
  expose it. "Add another bank" is intentionally absent from the
  settings card (disabled buttons advertise capabilities that
  don't exist).
- **Sidebar navigation.** Phase 4 introduces a User-menu link to
  `/settings/banks`; the top nav stays at three destinations
  (Dashboard / Transactions / Receipts). Sidebar earns its keep at
  five-plus destinations, likely Phase 6 (Investments).
- **Balance display.** CONTEXT.md explicitly defers caching balance
  on `bankAccount`; a stale cached balance shown without context
  is the "subtly wrong is worse than visibly empty" trap. If
  balance ships later, it always renders alongside its sync
  timestamp.
- **Pending transactions.** Booked-only is correctness, not scope.
  Anyone adding pending support later must explicitly handle the
  ephemeral `transactionId` rotation that breaks the unique-index
  dedup guarantee. See `.claude/rules/bank-sync.md`.
- **Fiscal-number-based receipt dedup against transactions.** Phase
  3 deferred fiscal-number extraction; Phase 4 doesn't revisit.
  Phase 5 (the match) is where that wedge sharpens.
- **Real GC sandbox fixture recording.** Synthetic fixtures suffice
  for the E2E pipeline; the live-sandbox conformance run (a
  structural rule) is what validates the parser against real GC
  shapes. Recording fixtures from real GC sandbox responses can
  follow as polish.

## Acceptance test, what "Phase 4 done" means

Four E2E specs plus one structural gate.

### `tests/e2e/bank-connect-sync.spec.ts` (ships in PR 3)

1. Log in.
2. Open the user menu, click `Bank connections`. Land on
   `/settings/banks`. Empty state visible.
3. Click `Connect SEB Lithuania`. Server action creates a
   GoCardless requisition (fixture-intercepted via
   `E2E_GOCARDLESS_FIXTURE_DIR`).
4. Test short-circuits the third-party redirect: navigate directly
   to `/api/gocardless/callback?ref={csrfTokenFromFixture}`.
5. Callback validates the signed cookie + reference, fetches
   accounts from the fixture, creates `bankConnection` plus
   `bankAccount` rows.
6. Settings page shows the connection card with bank name,
   connected timestamp, consent-expiry date, status `Connected`,
   accounts listed with IBAN-last-4 labels.
7. Click `Sync now`. Server action runs the manual-trigger sync;
   transactions fixture returns three rows. Navigate to
   `/transactions`. Assert three rows visible, all uncategorized.
8. Log out.

Spec asserts only what PR 3 actually ships: connect plus sync
producing uncategorized transactions. No AI suggestion checks, no
Accept button, no Needs review filter.

### `tests/e2e/categorization.spec.ts` (ships in PR 4)

1. Log in. Pre-seed an existing `bankConnection` plus
   `bankAccount` plus a couple of categories (Food > Groceries,
   Transport > Gas).
2. Create a rule "Maxima" -> Food > Groceries via the rules page.
3. Set up Gemini fixture returning a mix: one suggestion at
   confidence 0.93 (high), one at 0.62 (low), one with
   `categoryName: null`.
4. Click `Sync now`. Sync fixture returns four transactions:
   `MAXIMA`, `UBER`, `LIDL`, `UNKNOWN PAYEE`.
5. Assert:
   - `MAXIMA` row has `categorizationSource = 'rule'` with the
     Maxima category applied (visible in the list).
   - `UBER` row has the high-confidence AI category applied
     silently (visible in the list, no Accept button).
   - `LIDL` row stays uncategorized with an `AI suggests: …
     [Accept]` affordance inline.
   - `UNKNOWN PAYEE` stays uncategorized with no suggestion.
6. Apply the `?review=true` filter via the filter chip. Assert
   only `LIDL` and `UNKNOWN PAYEE` are visible.
7. Click `Accept` on the `LIDL` row. Assert it transitions to
   `categorizationSource = 'ai-reviewed'`, the suggestion clears,
   and the row disappears from the Needs review filter.

### `tests/e2e/rules.spec.ts` (ships in PR 4)

1. Log in. Pre-seed transactions: one `MAXIMA EUROPA VILNIUS`
   uncategorized, one `MAXIMA EXPRESS` with categorizationSource
   `ai` and an applied category, one `MAXIMA` manually categorized
   as `Other`.
2. Navigate to `/transactions/rules`. Create rule "Maxima" ->
   Food > Groceries.
3. Assert proactive scan:
   - `MAXIMA EUROPA VILNIUS` is now `Food > Groceries`, source
     `rule`.
   - `MAXIMA EXPRESS` is now `Food > Groceries`, source `rule`
     (overrides the prior `ai` source per the priority order).
   - `MAXIMA` (manually categorized as `Other`) is unchanged. The
     proactive scan does not touch `manual` rows.
4. Create a second rule "Maxima Express" -> Food > Restaurant.
5. Trigger a sync that returns a new `MAXIMA EXPRESS COFFEE`
   transaction (fixture). Assert it gets `Food > Restaurant` per
   longest-pattern-wins.

### `tests/e2e/bank-lifecycle.spec.ts` (ships in PR 5)

1. Log in with a pre-seeded `connected` bank connection.
2. Click `Disconnect` on the connection card. Assert undo-toast
   appears with "Disconnected from SEB Lithuania. [Undo]".
3. Click `Undo` within the 5-second window. Assert the connection
   card reappears in `connected` state.
4. Click `Disconnect` again. Wait past the 5-second window.
   Assert the connection card moves to an `Archived` section (or
   disappears from the active card area, depending on the PR 2
   mockup decision).
5. Click `Connect SEB Lithuania`. Short-circuit OAuth callback.
   Assert a new `connected` connection card appears.
6. Navigate to `/transactions`. Assert the historical
   transactions from the archived `bankAccount` are still visible
   in the list (preserved per the soft-archive rule). New
   transactions from a sync flow into the new connection.

### Live-sandbox conformance run (pre-PR 5 sign-off)

Andrius walks the full pipeline against live GoCardless sandbox
(not Centfolio's mocked fixtures): initial Connect via OAuth,
accounts listing, transactions fetch, sync runner write, rule and
AI categorization, Disconnect with undo, Reconnect. Documented in
PR 5's body per the structural rule in
`.claude/rules/bank-sync.md`.

## Pre-work

Ordered by when each unlocks the next PR.

**Before PR 1 opens:**

1. **GoCardless Bank Account Data account provisioned.**
   `GOCARDLESS_SECRET_ID` and `GOCARDLESS_SECRET_KEY` in
   `.env.local` and on the VPS at `/opt/centfolio/.env.local`.
2. **OAuth redirect URIs registered in the GoCardless dashboard.**
   Both `http://localhost:3000/api/gocardless/callback` and
   `https://centfolio.labrium.online/api/gocardless/callback`.
3. **`GOCARDLESS_COOKIE_SECRET`** generated via `openssl rand -hex
   32`. Added to `.env.local` and the VPS `.env`. Placeholder added
   to `.env.example`.
4. **Sentry IBAN scrub pattern enabled** in the Centfolio project's
   data-scrubbing settings as defense-in-depth for the redaction
   policy.

**During the PR 1 / PR 2 window** (parallel with foundations and
schema work):

5. **Manual sandbox-connect verification.** Walk the GC dashboard's
   "Sandbox Finance" or SEB Lithuania sandbox test flow end-to-end
   outside Centfolio code. The goal is to catch any sandbox
   onboarding friction (account-not-activated, sandbox-not-enabled,
   regional restrictions, sandbox SEB unavailable) while there is
   still time to resolve it before PR 3's OAuth code starts
   integrating. Document the discovered sandbox `INSTITUTION_ID`;
   PR 3's code hardcodes it for v1.

**Before PR 4 lands:**

6. **VPS crontab entry drafted** (not yet installed). Form:
   `0 2 * * * cd /opt/centfolio && npx tsx scripts/sync-daily.ts >> /var/log/centfolio-sync.log 2>&1`.
   Installed manually on the VPS when PR 4 merges.

**Before PR 5 sign-off:**

7. **Live-sandbox conformance run** per the structural rule. Real
   Connect via the OAuth flow, real sync, real categorization,
   real Disconnect plus Reconnect. Outcome documented in PR 5's
   body.

## PR breakdown

Five PRs, matching the Phase 2 and Phase 3 cadence.

### PR 1, Foundations (no UI, no migrations, no live calls)

Risk-front-loads the GoCardless SDK boundary and the discipline
rules before any feature code depends on them.

- `src/lib/gocardless/sdk.ts`: typed call wrappers
  (createRequisition, getRequisition, listAccounts,
  listTransactions). Per-trigger retry policy table. Fixture-
  directory bypass via `E2E_GOCARDLESS_FIXTURE_DIR` env var,
  mirroring Phase 3's pattern with multi-file shape.
- `src/lib/gocardless/map.ts`: transaction mapping function. Date
  is `bookingDate` with `valueDate` fallback and `logError` warn
  when the fallback fires. Payee uses direction-based party with
  the fallback chain through remittance, ending at `"Unknown"`
  (Unknown-payee rows still import; they represent real money
  movement). EUR-strict.
- `src/lib/gocardless/log.ts`: `scrubGcContext(ctx)` helper
  enforcing the whitelist policy. Allowed keys are internal IDs,
  failure metadata, and the `trigger` field; everything else is
  dropped silently.
- `src/lib/categorization/log.ts`: mirror helper
  `scrubCategorizationContext(ctx)` for the Gemini call paths.
- `src/lib/auth/signed-cookie.ts`: HMAC-SHA256 sign and verify
  helpers using `node:crypto`. No new dependency. Reads
  `GOCARDLESS_COOKIE_SECRET` from env.
- Zod schemas for `BankConnection`, `BankAccount`, the
  categorization response, the `Rule` shape. Live in
  `src/lib/gocardless/schema.ts`, `src/lib/categorization/schema.ts`,
  `src/lib/rules/schema.ts`.
- ADR-0002 amendments ship here.
- `.claude/rules/bank-sync.md` and `.claude/rules/categorization.md`
  ship here (already drafted during the grilling session).
- Vitest unit coverage: cookie sign / verify, transaction
  mapping (booked-only filter, EUR strict, payee fallback chain,
  Unknown payee preserved), GC SDK shape (mocked SDK calls,
  retry-policy behavior by trigger), categorization apply logic
  (defensive index handling against reordered or fewer responses).

### PR 2, Schema, mockups, `/impeccable critique` gate

- PB migrations:
  - `bankConnection` collection with the `Bank connection states`
    enum, requisition fields, `lastSyncedAt`, `lastSyncError`,
    `archivedAt`.
  - `bankAccount` collection with `gocardlessAccountId`, `iban`,
    `displayName`, `archivedAt`.
  - `rules` collection with `pattern`, `categoryId`. Index on
    `(userId, LENGTH(pattern) DESC)` for the longest-pattern-wins
    query.
  - `transactions` field additions (`gocardlessTransactionId`,
    `bankAccountId`, `categorizationSource`, `aiSuggestionCategoryId`,
    `aiSuggestionConfidence`, `aiSuggestionAt`) **paired with the
    partial unique index in the same migration file** per the
    sequencing rule in `.claude/rules/bank-sync.md`.
- `pocketbase/schema.json` regenerated and committed (per the
  Phase 2 / Phase 3 pattern: apply migrations to a fresh temp
  data dir, extract via the admin API, append to the existing
  file).
- Mockups under `docs/design/mockups/`:
  - `settings-banks-light.html` plus dark version, showing empty,
    connected, expiring, expired, archived, and error states.
  - `transactions-with-review-light.html` plus dark, showing the
    list with AI-suggestion-inline-with-Accept on relevant rows
    and the `?review=true` filter chip active.
  - `dashboard-needs-review-light.html` plus dark, showing the
    Needs review card alongside the existing This month card.
  - `rule-create-light.html` plus dark.
- `/impeccable critique` pass on every state, both modes. Findings
  fold in before merge.

### PR 3, GoCardless OAuth and initial connect plus first manual sync

The cheapest viable path through Phase 4: prove the OAuth and sync
plumbing end-to-end before categorization complexity layers on.

- `/settings/banks/page.tsx` plus the view component. Connection
  card visualizes the locked states.
- `Connect SEB Lithuania` button on the empty state. Server action
  creates the GoCardless requisition, sets the signed HMAC cookie
  with `{requisitionId, csrfToken, userId, createdAt}`, redirects
  to the GC link.
- `/api/gocardless/callback/route.ts`: read and verify the cookie,
  validate the reference param matches the cookie's CSRF token,
  validate the session userId matches the cookie's userId, fetch
  the requisition from GC, confirm status `LN` (linked), list
  accounts, create `bankConnection` and `bankAccount` rows. Clear
  cookie. Redirect to `/settings/banks` with a success toast.
- User menu picks up a `Bank connections` item.
- `Sync now` button on the connection card. Server action
  `syncNowAction` resolves the current user, calls
  `runSyncForUser(currentUser.id, { trigger: 'manual' })`.
- `src/lib/gocardless/run.ts`: `runSyncForUser` skeleton, fetches
  booked transactions per account, writes via the try-create plus
  double-checked-read pattern. **Categorization not invoked yet**;
  transactions land uncategorized. Categorization wiring is PR 4.
- `tests/e2e/bank-connect-sync.spec.ts`: the acceptance spec
  above for the connect-plus-uncategorized-sync flow.

### PR 4, Categorization, rules, and the Needs review surface

The behavior layer on top of the working sync.

- `src/lib/categorization/run.ts`: `categorizeBatch` function.
  Issues batched Gemini calls (50-chunk cap, sequential),
  defensive index handling on apply, 30-day stale-retry. Apply
  loop transitions rows per the priority order.
- `src/lib/rules/`: server actions `createRule`, `deleteRule`,
  `listRules`. Proactive recategorization scan after rule create;
  scope is uncategorized plus `categorizationSource = 'ai'` rows.
- `runSyncForUser` extended to invoke the rule engine and then
  the categorization batch after each account's transactions are
  written.
- `/transactions` extensions:
  - AI suggestion inline on rows with a stored suggestion, always
    visible. `[Accept]` button calls `acceptAiSuggestion(id)`
    server action.
  - `?review=true` filter chip (added to the existing filter bar).
- `/dashboard` extensions:
  - Needs review card alongside the This month card. Shows the
    count of transactions matching the needs-review filter, links
    to `/transactions?review=true`.
- `/transactions/rules/page.tsx`: list rules, create new rule,
  delete. Minimal management UI; no reorder or edit (rules are
  small enough that delete-and-recreate is the right primitive).
- `scripts/sync-daily.ts`: the OS cron entry point. Iterates
  users with at least one non-archived bank connection. Calls
  `runSyncForUser(userId, { trigger: 'cron' })` per user.
- VPS deploy note: install the crontab entry. Drafted in pre-work
  step 6, applied here.
- `tests/e2e/categorization.spec.ts` and
  `tests/e2e/rules.spec.ts`: the two acceptance specs above.

### PR 5, Disconnect, Reconnect, and sign-off

- `Disconnect` button on the connection card. Server action sets
  `archivedAt = now()` on the `bankConnection` and its
  `bankAccount` rows; Sonner toast with `[Undo]` for 5 seconds;
  finalize-or-undo pattern.
- `Reconnect` button visible on `expired` or `error` connections.
  Same OAuth flow as initial Connect; on success, the old
  `bankAccount` rows stay `archived` and a new pair is created.
- `lastSyncedAt` / `lastSyncError` surface on the connection card.
  "Last synced N minutes ago" or "Last sync had an error: …"
  in muted copy.
- `/about/privacy` extended with a bank-sync paragraph covering
  GoCardless as a new third party touching SEB data (Gemini
  categorization is already covered by the Phase 3 paragraph,
  which now applies to synced transactions too).
- `tests/e2e/bank-lifecycle.spec.ts`: the acceptance spec above.
- Live-sandbox conformance run documented in the PR body per
  the structural rule.
- `CHANGELOG.md`: Phase 4 entry under Keep a Changelog
  conventions.
- `PROJECT.md`: Phase 4 marked ✓ shipped with date.
- `docs/plans/phase-4-bank-sync.md`: status flipped to Shipped.

## Open questions deferred to execution time

- **Connection card layout when expiring or archived.** Mockup
  decision in PR 2 plus impeccable critique. Default: a single
  `Bank connections` section with active cards on top, an
  `Archived` subsection below when any archived rows exist.
- **Cron timezone semantics.** VPS uses UTC by default; the
  02:00 Vilnius spec means an offset-aware crontab. Two options:
  set the crontab line in Vilnius local time via `TZ=Europe/Vilnius`
  prefix, or hardcode the UTC equivalent and accept seasonal
  drift. Lean toward `TZ=Europe/Vilnius` for honesty; finalize in
  PR 4.
- **Sync-result toast copy.** "Synced N transactions" vs "Sync
  complete. N new, M existing updated" vs more concise forms.
  PR 4 mockup-critique decides.
- **Failed-state copy on the connection card.** "Last sync had an
  error" plus the `lastSyncError` value, or just a generic
  "Connection has an issue"? PR 5 decides; default to surfacing
  the structured-error reason when present.
- **First-time-connecting tutorial.** Out of Phase 4 scope; the
  empty state Connect button plus the privacy disclaimer is the
  v1 onboarding.

## References

- PROJECT.md, Phase 4 goal and success criteria
- CONTEXT.md, the `Bank connection`, `Bank account`, `Archived
  account`, `Sync`, `Categorize`, `Rule`, `AI suggestion` entries
  (Bank connection / Bank account / Archived account amended
  during the 2026-05-31 grilling session)
- ADR-0001, stack choices (EUR only, integer cents storage, Zod)
- ADR-0002, Bank aggregator decision (amended 2026-05-31 for
  booked-only sync and the logError redaction policy)
- ADR-0003, Receipt OCR pipeline (the Gemini SDK boundary plus
  prompt patterns from Phase 3 carry forward to categorization)
- ADR-0005, no historical backfill (constrains the initial sync
  scope and the soft-archive Disconnect rationale)
- ADR-0006, testing strategy (TDD for pure-logic modules,
  Playwright for E2E, record-and-replay for external APIs)
- `.claude/rules/bank-sync.md` (new in PR 1)
- `.claude/rules/categorization.md` (new in PR 1)
- `.claude/rules/pocketbase.md` (zero-valued-number quirk plus
  the date-as-datetime normalization rule)
- `.claude/rules/server-actions.md` (Zod validation, userId
  scoping, error surfacing)
- `.claude/rules/receipts.md` (Gemini SDK boundary pattern,
  fixture discipline, Suspense contract; categorization inherits
  the SDK and fixture parts)
- `.claude/rules/testing.md` (data-testid for E2E, mocking at
  the SDK boundary)
- docs/retrospectives/phase-3.md (the carry-forward decisions
  list that informs this plan)
