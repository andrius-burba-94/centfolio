---
paths:
  - "src/lib/receipts/**"
  - "src/lib/gemini/**"
  - "src/app/(app)/receipts/**"
  - "src/components/receipts/**"
  - "tests/fixtures/gemini/**"
  - "tests/e2e/receipts-*.spec.ts"
  - "docs/adr/0003-receipt-ocr.md"
---

# Receipts

Phase 3 ships two input modes (text paste, photo upload) that share
a single parse / confirm / store pipeline. The rules below capture
the discipline decisions from the 2026-05-31 grilling session, in
the order the code is most likely to violate them.

## Currency

Receipts are EUR-only in v1, locked by ADR-0001. The Zod schema for
`ParsedReceipt` does not carry a currency field. A multi-currency
posture (foreign receipts on travel, etc.) is out of scope for v1
and would require schema work plus display work at the UI edge.

## Future dedup key

Fiscal / receipt number (the Lithuanian `Fiskalinis numeris` line)
is **not** extracted in Phase 3. When dedup ever earns its keep
(Phase 5 bank match against existing receipts, Phase 7 "duplicate
receipt" guard), the natural unique key is `(userId, fiscalNumber)`.
Add the field and the unique index then; do not add either now.

## Parsing rate limits

Two layers of defense, both required:

1. **Per-row cap** (`parseAttempts` on the receipt row, capped at 3).
   The detail-page RSC may fire Gemini only if `status = 'parsing'`
   AND `parseAttempts < 3`. At the cap, `status` auto-transitions to
   `'failed'` with `failureReason = 'exceeded parse attempts'`.
2. **Account-level cap** (GCP billing budget alert + Generative
   Language API quota cap on the Google Cloud project). The
   per-row cap defends against per-receipt hammering; the account
   cap defends against a leaked key, a runaway loop bug, or an
   accidentally-shared link being refresh-hammered by a bot.

`parseAttempts` **increments before** the Gemini call, not after.
Abandoned tabs count against the cap. This is the strict semantic;
it bounds the worst case where a misbehaving client repeatedly
renders the detail page for the same receipt.

`retryParse(receiptId)` resets `parseAttempts` to 0 and `status`
to `'parsing'` **server-side only**. The client never supplies a
reset value. The reset action is also rate-limited at the server
boundary: one reset per receipt per minute is the soft ceiling.

## Suspense boundary contract

`/receipts/[id]` is an RSC. Its shell (header, source-evidence
pane, status badge, delete affordance) renders synchronously from
the already-stored receipt row. The parsed-fields region is wrapped
in `<Suspense fallback={<ReceiptParsingSkeleton />}>`. The child
component reads `status`:

- `'parsing'` and `parseAttempts < 3`: invoke Gemini, write back,
  re-read, render the parsed result.
- `'parsed'`: render fields with no await.
- `'failed'`: render the failed-state UI with the Try again button.

The shell must never await Gemini. The fallback must always render
within a few hundred milliseconds. This is the whole UX advantage
of the sync-behind-navigation pipeline; lose it and the page hangs
on the redirect like a vanilla synchronous server action.

## No thrown errors from the awaiting child

The component inside the Suspense boundary catches Gemini failures
internally and writes `status: 'failed'` with a `failureReason` to
the receipt row, then re-reads and renders the failed-state UI. It
does not throw to the boundary. Suspense's job is loading-fallback,
not error-fallback; thrown errors require a separate ErrorBoundary
sibling, which Phase 3 deliberately avoids by handling errors as
data on the row.

Categories of failure caught this way:

- Gemini API timeout, rate-limit, or upstream error
- Malformed JSON in the response
- Valid JSON but Zod-rejected (missing required field, wrong type)
- Schema mismatch between the prompt's response_schema and the
  response body

## Line item sum is not a system invariant

`totalCents` on the receipt is the authoritative parse target: the
bill total as it appears on the source receipt. The sum of line
item `lineTotalCents` is **not** guaranteed to equal it. Receipts
with per-item discounts, whole-receipt adjustments, or split-tender
loyalty-currency lines legitimately break the invariant.

Do not assert `sum(lineItems) == totalCents` anywhere in code.
Do not surface reconciliation warnings in the review UI unless
explicitly designed to (Phase 3 does not). Line totals may be
negative for discount and split-tender lines; the Zod schema
admits signed `lineTotalCents`.

## Fixture discipline

E2E specs control Gemini's response via a **server-side file
bypass**, NOT via Playwright `page.route()`. The Gemini call
originates from a server-side RSC; Playwright's route interceptor
only sees browser fetches and would silently miss the call.

The mechanism (see `src/lib/gemini/sdk.ts`):

- If the env var `E2E_GEMINI_FIXTURE_FILE` is set, `callGeminiText`
  reads the file at that path and returns its contents as the
  Gemini response body, bypassing the real SDK call.
- The var is set by `scripts/ci-e2e.sh` and the GitHub Actions
  workflow only. It is never set in production.
- Tests write the desired body to the file before each test (see
  `tests/helpers/gemini-mock.ts`: `setGeminiHappy`, `setGeminiMalformed`).
- `afterEach` calls `clearGeminiFixture` so a missing setup in the
  next test surfaces as a clear "fixture not readable" error rather
  than silently replaying the prior test's body.

Recorded-fixture-from-real-receipts discipline:

- One fixture per real-world parse case (`iki-email-typical.json`,
  `maxima-receipt-typical.json`, `iki-malformed.json` for the
  failed-state path, `iki-zod-reject.json` for the validation-
  failure path).
- Fixtures captured from real Lithuanian receipts with PII scrubbed
  before commit: loyalty IDs, email recipients, phone numbers,
  cashier IDs. The scrub is manual; assume nothing.
- The first set must include at least one **adversarial** fixture
  (a Maxima receipt with `AČIŪ nuolaida prekei` discount lines,
  `Atsiskaityta MAXIMOS pinigais` split-tender lines, and
  multi-quantity `1,39 X 2 vnt.` lines). A prompt that only passes
  clean receipts misses the 90% real-world bar.

## Source-of-truth boundary

The Zod schema in `src/lib/receipts/schema.ts` is the **single
source of truth** for the parsed receipt shape, per ADR-0003. The
OpenAPI / response_schema sent to Gemini is derived from it (using
`z.toJSONSchema()` or an equivalent). Do not maintain two parallel
schemas; do not hand-write the JSON Schema separately.
