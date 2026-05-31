# Phase 3 Retrospective

- Phase: 3, Receipts
- Shipped: 2026-05-31 (same day as Phase 2; the two phases overlapped
  with Phase 2 sign-off and Phase 3 kickoff happening within hours
  of each other)
- PRs: 6 merged (#32 plan + #33-37 phase PRs, four follow-up bug-fix
  commits inside PR #36)
- Author: Andrius, with Claude
- Purpose: capture lessons before Phase 4 inherits the same patterns.
  Phase 2's retrospective was not written; its lessons fold forward
  implicitly through the patterns Phase 3 reused (Sheet sheet,
  Combobox shapes, ActionResult, undo-delete, 5-PR breakdown).

## What Phase 3 was

Two input modes (paste-text first, photo follow-up) sharing one
parse/confirm/store pipeline. Gemini 3.5 Flash via the official
`@google/genai` SDK with `responseJsonSchema` derived from a Zod
source-of-truth schema. Sync-behind-navigation pipeline: upload
posts -> row in `parsing` -> `router.push('/receipts/[id]')` ->
RSC awaits Gemini inside a `<Suspense>` boundary with a skeleton
fallback. `parseAttempts` cap of 3 with server-side reset, plus
an account-level GCP billing budget and API quota cap as
defense-in-depth.

## What worked, worth doing again in Phase 4

### Eighteen-round grilling before any code

`/grill-with-docs` ran for 18 questions on Phase 3 scope before
PR 1 opened. CONTEXT.md amendments landed inline as the grill
crystallized them (state-machine rename `pending` -> `parsing`,
Receipt admits photo OR text, `Receipt source text` entry, Line
item admits signed totals and the no-sum-equals-total invariant,
`failed` state amended with retry/delete and the future-direction
note). ADR-0003 amendment, `.claude/rules/receipts.md`, and the
5-PR breakdown all derived from the locked grilling outcomes.

The architectural decisions that mattered most:

- **Sync-behind-navigation pipeline** (Q1, third option that
  emerged from the user's pushback on my two-option framing).
  Made the entire detail-page UX work; would have been a much
  worse design without it.
- **Parser quality cap shape** (Q3): per-row `parseAttempts` for
  per-receipt orphans, account-level GCP quota for catastrophic
  bot-crawler runaway. Both layers are real.
- **Gamma sequencing for the two input modes** (Q9): text first,
  photo follow-up. Let the cheap path validate the entire
  pipeline before `sharp` and HEIC entered the picture.
- **Signed line totals** (Q18): admits discount and split-tender
  lines as their own negative-total rows, no fold-in arithmetic
  for Gemini to botch, `totalCents` as the authoritative parse
  target rather than a computed sum.

### Mockup + `/impeccable critique` cycle before any UI code

PR 2 shipped two static HTML mockups (light + dark) covering all
six receipt states, plus an `/impeccable critique` pass that
surfaced five real issues which folded in before merge:
Reading-Load violation on the quantity column, spreadsheet-feel
on line items, italic on discount lines, missing focus-state on
inline edits, noisy parsing-skeleton header. Catching these in
HTML rather than in React saved a PR-cycle of refactoring later.

### One Zod schema, two prompts, one downstream pipeline

The line that earned the most miles: `parsedReceiptSchema` in
`src/lib/receipts/schema.ts` is the single source of truth.
`z.toJSONSchema()` produces the `responseJsonSchema` sent to
Gemini, the same shape Zod validates the response against, the
same shape `parseReceiptText` and `parseReceiptPhoto` return.
Text mode and photo mode share `SHARED_FIELD_RULES` in the
prompt; the only difference is the vision-specific preface.

### Defense-in-depth on rate limits

Per-receipt `parseAttempts` cap (3, server-side reset only)
catches per-row orphan hammering. Account-level GCP billing
budget + Generative Language API quota catches the catastrophic
case (leaked key, runaway loop, accidentally-shared link being
refresh-hammered by a bot). Both are required; neither alone is
sufficient.

### Live testing as the validation surface

Phase 3's bugs surfaced only against real receipts. The PB v0.38.1
zero-valued-number quirk hit `parseAttempts: 0` on the first save,
then `lineItems.position: 0` on the first parsed-row write. Neither
was reproducible from unit tests; both took less than ten minutes to
isolate once a real Maxima paste hit the live pipeline. The fast
diagnose-fix-push cycle on PR #36 (four follow-up commits) was the
pattern that turned each surfacing into a permanent rule.

### Structured logging at server boundaries

Every server-action error path used `logError(err, ctx)` from
Phase 1, and Phase 3 inherited it without thinking. The JSON
output landed in `nextjs-ci.log` with the failing field name
clearly visible (`"parseAttempts": "Cannot be blank"`), which is
how the two PB quirks got caught instantly. Worth not regressing.

## What didn't work, worth pre-empting in Phase 4

### Playwright `page.route()` on a server-side fetch

The original `tests/helpers/gemini-mock.ts` intercepted Gemini at
the browser HTTP layer via `page.route()`. The Gemini call
originates from an RSC running server-side; `page.route()` only
sees browser fetches and silently missed every call. CI passed
locally (no Gemini key, every request failed, both happy and
failed E2E specs landed on the failed state. Happy was wrong;
failed was right for the wrong reason. Caught only on the first
PR push when CI ran fresh.

**Action:** the SDK-boundary file bypass (env-gated, `sdk.ts` reads
`E2E_GEMINI_FIXTURE_FILE`) is the right shape for any future
server-side external call. Phase 4 will hit this with GoCardless;
the same pattern (or `msw/node`) should land at the SDK boundary
from PR 1, not be retrofitted after CI catches the gap.

### PB v0.38.1 zero-valued-number `required: true` quirk

Discovered twice in Phase 3 (receipts.parseAttempts, then
lineItems.position / lineTotalCents / quantity). Each instance
needed its own follow-up migration. The rule is now documented in
`.claude/rules/pocketbase.md`, but the cost of rediscovery was
real.

**Action:** before merging any Phase 4 migration that adds a
number field, grep the diff for `"type": "number"` plus
`"required": true` and flag for review. The rule file has it; the
discipline needs the rule loaded.

### Date format drift PB <-> input[type=date] <-> Zod

PB stored dates as full datetimes (`"2026-05-31 00:00:00.000Z"`);
`<input type="date">` renders blank for anything not YYYY-MM-DD;
Zod regex on `confirmReceipt` rejected the blank. The round-trip
broke silently and surfaced only on the first real Confirm attempt.

**Action:** `Receipt.date` was already typed as YYYY-MM-DD per
CONTEXT.md. The fix was a slice in `toReceipt`. The pattern: every
PB date field gets normalized at the record converter, not in
consumers. Worth a `.claude/rules/pocketbase.md` line.

### Wrong initial GEMINI_MODEL pin

The grilling session committed to a "always-dated-snapshot" policy
based on my memory of Google's model-aliasing scheme. Reality:
`gemini-3.5-flash` (bare stable identifier) is itself durable on
the Stable channel; the dated suffixes are for per-revision freezes.
User corrected from the GCP console after PR 1.

**Action:** when a rule depends on an external system's naming
conventions, verify against the live system (console, docs) before
committing the rule in writing. Don't lock from memory.

### Prompt design shipped as TODO placeholder

PR 1's `TEXT_MODE_SYSTEM_INSTRUCTION` was a one-line TODO. The
real prompt landed in PR 3 alongside the SDK call. This was
deliberate (the plan said "prompt iterates against real
fixtures") but it meant PR 1's unit tests were testing a
non-functional prompt. Slight anti-discipline.

**Action:** when a TODO ships, the test coverage should pin the
shape of the eventual fill-in, not the placeholder. The Vitest
tests for `parseReceiptText` mocked the SDK to return canned
JSON, which is correct, but I could have added a test that asserts
the prompt contains certain literal strings (e.g., "discount lines")
to catch prompt-design regressions in Phase 4 when iteration happens.

## Decisions Phase 3 made that Phase 4 should respect

These were earned through grilling, live testing, or implementation
pain. Don't unearn them by accident.

- **Zod is the source of truth for any external response shape.**
  `responseJsonSchema` derives from Zod via `z.toJSONSchema()`. Do
  not maintain a parallel hand-written JSON Schema. Same pattern
  applies to GoCardless transaction payloads in Phase 4.
- **External API calls live behind a single SDK-boundary file**
  (`src/lib/gemini/sdk.ts`). Tests bypass at that file (vi.mock for
  unit, E2E fixture file for end-to-end). Phase 4 GoCardless should
  mirror: `src/lib/gocardless/sdk.ts`.
- **Errors as data, not as throws across Suspense.** The
  parse-then-write-row-then-render-failed-UI pattern in
  `parseReceiptIfNeeded` works because the awaiting component
  catches everything and writes failure state to the row. Phase 4
  sync should follow: catch the GoCardless failure, write status
  on the bankConnection row, render from that. No ErrorBoundary
  needed.
- **Per-row + account-level rate limits both.** Per-row caps catch
  the per-record orphan case; account-level caps catch the
  catastrophic case. Both are required.
- **PB number fields with `required: true` reject 0.** Always set
  `required: false` if the field can legitimately be 0 (counters,
  positions, signed cents that may be zero).
- **PB date fields are full datetimes; normalize at the record
  converter.** Slice to YYYY-MM-DD on read.
- **Live testing is the validation surface.** Unit tests pin
  shape; live testing surfaces the integration bugs that
  Phase 4 will absolutely have its share of (cron timing,
  consent expiry, idempotency edge cases).

## Carry-forward follow-ups (not blocking)

- **Real receipt fixture recording.** The SDK-boundary bypass and
  the helper format are in place; recording from PII-scrubbed real
  receipts lands when prompt iteration starts (Phase 4 or 5 era).
- **Editing the receipt total in the review UI.** Deferred per the
  plan; Gemini gets the total right in practice. Polish if real use
  surfaces a need.
- **`next/image` for the photo evidence pane.** Currently a plain
  `<img>` with an eslint-disable; would require configuring
  `remotePatterns` for the PB host. Phase 4+ when image perf earns
  it.
- **VPS `vips-heif` confirmation and nginx `client_max_body_size 15M`.**
  Pre-work for PR 5 deploy, applied by Andrius.

## Action items for Phase 4 kickoff

Before the first Phase 4 PR opens:

1. **`grill-with-docs`** on Phase 4 scope. Phase 4 has more novel
   surface than Phase 3: OAuth flow with redirect URIs, daily cron,
   90-day consent expiry, rule engine, AI categorization confidence
   thresholds, "Needs review" surface. Multiple ADR-worthy
   decisions buried in there.
2. **Add a `.claude/rules/pocketbase.md` line** on date normalization
   at the record converter (mirror the existing zero-valued-number
   rule). Cheap insurance against rediscovery on the transactions
   write path.
3. **Pre-design the SDK boundary for GoCardless** before PR 1 opens.
   Mirror the `src/lib/gemini/` structure: `sdk.ts` (SDK calls,
   E2E bypass), `client.ts` (typed wrappers), `prompt.ts`-equivalent
   (URL builders, schemas). Saves the retrofit Phase 3 needed.
4. **Plan doc** at `docs/plans/phase-4-bank-sync.md`, informed by
   this retrospective.

## What I'd tell future-Andrius about Phase 3

The grilling session was 18 questions long; that's a real
investment. It paid off twice: once at plan-write time (no
re-cutting the PR breakdown), once at live-testing time (every
bug landed on a shape the rules had already named, so the fix
was always small).

The Suspense contract was the load-bearing decision. The
sync-behind-navigation pipeline came out of the user pushing back
on a binary I'd framed wrong. Bidirectional grilling matters.

The four follow-up bug-fix commits in PR 4 are the right shape:
fast diagnose, fast fix, document the rule, push. None of them
should have shipped, but each made the codebase stronger by
forcing the rule into writing. Don't be afraid of in-flight
fixes on an open PR; the alternative is shipping a half-broken
slice or holding a PR over a weekend.

The hardest hour was diagnosing why the Playwright mock wasn't
firing in CI. The hour I'd most want back was the initial Zod
schema's nullable-as-anyOf output, which Gemini might reject in
some configurations. Caught and worked around (the schema works
in practice), but the surface is bigger than my unit tests
exercised.

Phase 4 starts with two anchors: the SDK-boundary file pattern
for external services, and the live-testing-is-the-validation-
surface mindset. Phase 4 will have more integration bugs than
Phase 3 had. Lean into them quickly; the rule file is the
durable artifact.
