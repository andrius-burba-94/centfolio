# Phase 3, Receipts

- Status: Shipped 2026-05-31
- Date: 2026-05-31
- Owner: Andrius
- Prerequisites: Phase 2 shipped (CHANGELOG.md records 2026-05-31).
  No Phase 2 retrospective yet; lessons applied in flight.

## Goal

A photographed receipt or a pasted email-receipt text becomes
structured data (merchant, date, total, and line items) that the
user reviews, confirms, and finds in a receipts list. Two input modes,
one shared pipeline (parse → confirm → store), one shared review UI.

The wedge for Phase 5 (the match) is built here: every line item the
user reviews in Phase 3 is the same row Phase 5 will surface against a
bank transaction. Phase 3 doesn't do the match; it makes the match
possible.

Success criterion per PROJECT.md: 90% correct parse on typical
Maxima / IKI / LIDL receipts, 10% correctable in under a minute.

## What's in scope

- Receipts list (`/receipts`), detail (`/receipts/[id]`), entry sheet
  at `?new=true` (text input in PR 4, photo input added in PR 5)
- Two input modes:
  - **Text**: paste the body of an emailed receipt summary (Maxima
    Ačiū, IKI Bonus). Cheapest possible vertical slice; lands first.
  - **Photo**: mobile camera capture and desktop file picker, single
    photo per receipt, server-side normalized via `sharp`.
- Sync-behind-navigation pipeline: upload posts → server action
  creates row in `parsing` state → `router.push('/receipts/[id]')` →
  the detail RSC wraps the Gemini-awaiting region in a `<Suspense>`
  boundary with a skeleton fallback.
- Gemini 2.5 Flash with `responseSchema` + `responseMimeType:
  'application/json'`. The Zod schema is the source of truth; the
  OpenAPI schema sent to Gemini is derived from it (per ADR-0003).
- Resilience: `parseAttempts` field on the receipt row, capped at 3,
  reset only server-side. Idempotent RSC re-fires on `parsing` rows
  below the cap. Above the cap, status auto-transitions to `failed`.
- Privacy: inline disclaimer on the entry sheet plus a standalone
  `/about/privacy` page. No consent gate; ADR-0003's punt resolved
  per Q11 of the grilling session.
- `Receipts` inline link in the top nav alongside Dashboard and
  Transactions.
- Two E2E specs, one per mode, lockstep with the PR they ship in.
  Gemini calls intercepted at the HTTP boundary and replayed from
  recorded fixtures under `tests/fixtures/gemini/`.

## What's deferred

- **`transactionId` on receipts**, the link to the matched Phase 2
  transaction. Phase 5's PR adds the column alongside the match logic
  and the match UI. The `matched` receipt state stays a documented
  promise in CONTEXT.md until then.
- **Fiscal / receipt number extraction.** Free signal from Gemini but
  zero Phase 3 callers. Documented in `.claude/rules/receipts.md` as
  the natural `(userId, fiscalNumber)` dedup key when dedup earns its
  keep.
- **Time of day, payment method, VAT breakdown, discount totals,
  cashier ID.** Phase 5 may want some of them; defer until they earn
  it.
- **Hand-typed manual receipt entry.** CONTEXT.md amended in Q10 to
  document the future-direction shape: a bridge to a Phase 2
  transaction (recorded without line-item detail), not a duplicate
  receipt form. Out of scope for v1.
- **Sidebar navigation.** Top-bar inline link pattern continues. The
  honest trigger is 5+ primary destinations, likely Phase 4 (bank
  connection) or Phase 6 (investments).
- **Multi-photo per receipt.** v1 ships single-photo. Long receipts
  that don't fit one frame are out of scope.
- **Phase 5 match logic**: receipts and transactions stay
  unconnected through Phase 3.
- **Phase 7 search across receipts and line items.**
- **Multi-currency.** ADR-0001 commits to EUR; `.claude/rules/
  receipts.md` locks the assumption explicitly for receipts.

## Acceptance test, what "Phase 3 done" means

Two E2E specs, both asserted via `data-testid`, both using recorded
Gemini fixtures intercepted at the HTTP boundary.

### `tests/e2e/receipts-text.spec.ts` (ships in PR 4)

1. Log in as seed user.
2. Click `Receipts` in top nav. Empty state visible at `/receipts`.
3. Click "Add receipt". Sheet opens, URL becomes
   `/receipts?new=true`. Privacy disclaimer line visible.
4. Paste the `iki-email-typical.txt` fixture body. Click Save.
5. Sheet closes; URL becomes `/receipts/[id]`. Suspense fallback
   "Parsing receipt…" renders within 200ms.
6. Recorded Gemini fixture resolves; parsed fields populate:
   merchant `IKI`, date, totalCents, line items.
7. Edit one line item's name. Add one line item. Delete one line
   item. Confirm.
8. Status badge transitions to `confirmed`. URL stable.
9. Navigate back to `/receipts`. The receipt is in the list.
10. Open the receipt again. Source text pane shows the original
    pasted body.
11. Trigger a failed-state path: upload `iki-malformed.txt` fixture
    (Gemini fixture set to `gemini-malformed.json`). Detail page
    eventually renders failed state after 3 attempts.
12. Click "Try again" (this is a separate test setup with a good
    fixture). Status returns to `parsing`, then `parsed`.
13. Delete the failed receipt. Log out.

### `tests/e2e/receipts-photo.spec.ts` (ships in PR 5)

1. Log in.
2. `/receipts` → "Add receipt" → sheet → switch to "Photo" tab.
3. Upload `maxima-receipt-typical.jpg` fixture (≤5 MB).
4. Server normalizes via `sharp`; receipt row created; navigate to
   `/receipts/[id]`.
5. Suspense fallback → Gemini fixture resolves → parsed fields
   populate.
6. Photo evidence pane renders the normalized image.
7. Confirm. Navigate to `/receipts`; receipt is in the list with a
   photo source-type indicator.
8. Log out.

Unit tests cover the money lib (already shipped Phase 2), the Gemini
client (Vitest with mocked SDK), the server actions, and the
`sharp` pipeline (deterministic input → expected dimensions, JPEG
format, EXIF stripped).

## Pre-work before PR 1

1. **GCP project + Gemini API key provisioned.** Generative Language
   API enabled. Key in `.env.local` and the VPS `.env`. CI does **not**
   need the key; fixtures are pre-recorded.
2. **Billing budget alert + API quota cap on the GCP project.** The
   account-level complement to the per-receipt `parseAttempts` cap.
   Caps catastrophic runaway at the source.
3. **Verify current stable dated Gemini model.** Look up the latest
   stable `gemini-2.5-flash-*` dated version at PR 1 time (do not
   hardcode from memory). PR 1's `GEMINI_MODEL` constant gets that
   value.
4. **Gather PII-scrubbed real receipts for fixtures.** One typical
   Maxima photo, one typical IKI email body, plus one adversarial
   Maxima with per-item discounts (`AČIŪ nuolaida prekei: -0,80`),
   loyalty-currency split-tender (`Atsiskaityta MAXIMOS pinigais
   -0,17`), and multi-quantity (`1,39 X 2 vnt.`). Scrub loyalty IDs,
   email recipients, phone numbers before committing.
5. **libvips / HEIC verification on VPS.** `dnf list installed | grep
   vips` and confirm HEIC support; `sudo dnf install vips-heif` if
   missing. Defer to before PR 5; PR 1–4 don't depend on it.

## PR breakdown

Five PRs, matching the Phase 2 cadence.

### PR 1, Foundations (text-mode prep, zero rendered UI)

Risk-front-loads the Gemini integration and the discipline rules
before any feature code depends on them.

- `src/lib/receipts/schema.ts`: Zod for `ParsedReceipt`
  (`merchant`, `date`, `totalCents`, `lineItems[]`). Line items
  carry `name`, `quantity` (number, default 1), `unit` (nullable
  string), `unitPriceCents`, `lineTotalCents` (signed; may be
  negative for discount and split-tender lines).
- `src/lib/gemini/client.ts`: text-mode `parseReceiptText(text)`
  only. Reads `GEMINI_API_KEY` and a `GEMINI_MODEL` constant pinned
  to the dated version verified in pre-work. Uses `responseSchema`
  derived from the Zod schema + `responseMimeType:
  'application/json'`. Photo-mode `parseReceiptPhoto(buffer)` lands
  in PR 5.
- ADR-0003 amendment: text-mode call shape, `sourceType` enum,
  `sourceText` audit field. The amendment notes that both modes
  share the same Zod contract and the same `responseSchema`.
- `.claude/rules/receipts.md` (new file). Captures every discipline
  rule from the grilling session:
  - EUR-only lock (no multi-currency on receipts in v1)
  - `(userId, fiscalNumber)` as the documented future dedup key
  - `parseAttempts` cap = 3, reset only server-side in the
    `retryParse` action; never trust client-supplied reset
  - Suspense boundary contract: detail page shell renders
    synchronously, the parsed-fields region is wrapped in
    `<Suspense>` with a `<ReceiptParsingSkeleton>` fallback
  - `parseAttempts` increments **before** firing Gemini (strict
    semantics; abandoned tabs count against the cap)
  - No thrown errors from the awaiting component; Gemini failures
    write `status: 'failed'` with a `failureReason` to the row
    and the component re-reads + renders the failed-state UI
  - PII scrub discipline for fixtures
  - Billing budget + API quota cap is the account-level rate
    limit, the per-row `parseAttempts` cap is the row-level one
  - No assertion of `sum(lineItems) == totalCents` anywhere; the
    invariant doesn't hold for receipts with discounts or split
    tenders
- Vitest unit coverage for the Gemini text-mode client.

### PR 2, Schema, mockups, `/impeccable critique` gate

- PB migrations:
  - `receipts`: `id, userId, status, merchant, date, totalCents,
    photo (file), sourceType ('photo' | 'text'), sourceText (text,
    nullable), parseAttempts (int, default 0), failureReason
    (string, nullable), createdAt, updatedAt`.
  - `lineItems`: `id, userId, receiptId (relation), name, quantity
    (number), unit (string, nullable), unitPriceCents (int, nullable),
    lineTotalCents (int, signed), position (int), createdAt,
    updatedAt`. `userId` is denormalized for PB rule simplicity;
    migration comment explains why.
- `pocketbase/schema.json` regenerated and committed.
- PB rules per collection, `userId`-scoped, mirroring Phase 2's
  pattern: `userId = @request.auth.id` on listRule, viewRule,
  deleteRule; the create/update rules also verify
  `@request.body.userId = @request.auth.id`.
- `docs/design/mockups/receipts-light.html` and
  `receipts-dark.html`:
  - Receipts list (empty + populated)
  - Entry sheet, text mode (textarea + privacy line + Save)
  - Detail page: `parsing` (Suspense skeleton), `parsed` (review
    UI), `confirmed` (read-only), `failed` (with Try again)
  - Token-aligned per DESIGN.md.
- `/impeccable critique` runs on every state, both modes. Findings
  fold in before merge.

### PR 3, Server actions and Gemini fixture infrastructure

- Server actions, Zod-validated, `userId` derived from session never
  accepted from the client:
  - `createReceiptFromText(text)`: creates row in `parsing` state,
    returns `receiptId`. Caller (the entry sheet) handles
    `router.push`.
  - `parseReceipt(receiptId)`: called by the detail RSC. Increments
    `parseAttempts` before firing Gemini; on success writes
    `status: 'parsed'` + parsed fields + line item rows; on failure
    writes `status: 'failed'` + `failureReason`.
  - `retryParse(receiptId)`: resets `parseAttempts` to 0 and
    `status` to `parsing` server-side. The detail RSC re-fires on
    the next render.
  - `confirmReceipt(receiptId, payload)`: parsed → confirmed,
    persists user edits to receipt fields and line items.
  - `addLineItem`, `updateLineItem`, `deleteLineItem`,
    `deleteReceipt`.
- `tests/fixtures/gemini/` directory and `tests/helpers/gemini-mock
  .ts` Playwright helper. Initial fixtures: `iki-email-typical
  .json`, `iki-malformed.json`, `iki-zod-reject.json`. The Maxima
  photo fixture lands in PR 5.
- Recording flow: `UPDATE_FIXTURES=true npm run test:e2e` lets calls
  through and writes the responses; commit the diff.
- Unit tests for the server actions.

### PR 4, Text-mode vertical slice and E2E

- `/receipts/page.tsx`: empty state ("No receipts yet. Paste one to
  get started.") + populated list (one row per receipt, source-type
  indicator, status badge, merchant, date, total).
- `/receipts/[id]/page.tsx`: RSC with the Suspense contract. Shell
  renders synchronously; parsed-fields region is wrapped.
- `<ReceiptParsingSkeleton>` component (default: 5 line-item-row
  skeletons, header skeleton, totals skeleton).
- Entry sheet at `?new=true`: textarea + privacy disclaimer line +
  Save. Mirrors Phase 2's `<Sheet>` pattern.
- `/about/privacy/page.tsx`: honest disclosure covering what data
  leaves the VPS, who it goes to (Google, `gemini-2.5-flash-*`
  pinned), Centfolio's retention policy. Links to ADR-0003 for the
  engineering detail.
- `Receipts` inline link in the top nav between `Dashboard` and
  `Transactions`.
- `tests/e2e/receipts-text.spec.ts`: the acceptance test above for
  the text mode.
- Intermediate commits inside the PR 4 branch:
  1. List page renders with PB-seeded receipts. Empty state and
     populated state both wired.
  2. Entry sheet opens, textarea submits, server action creates a
     `parsing` row, navigation happens.
  3. Detail RSC renders shell + Suspense + parsed fields after the
     Gemini fixture resolves.
  4. Confirm flow: edit line items, save, status transitions to
     `confirmed`.
  5. Delete flow.
  6. Failed-state path: Gemini fixture returns malformed JSON,
     `parseAttempts` increments past the cap, status auto-
     transitions to `failed`, Try again works.

### PR 5, Photo-mode and sign-off

- `sharp` dependency add (approved in Q8 of the grilling session).
- VPS libvips/HEIC verified per pre-work.
- nginx `client_max_body_size 15M` adjustment captured as a deploy
  note (and applied to the VPS).
- `parseReceiptPhoto(buffer)` in `src/lib/gemini/client.ts`.
- `createReceiptFromPhoto(file)` server action: receives `File`,
  runs through `sharp`:
  1. Decode (JPEG, HEIC, PNG, WebP all supported)
  2. Auto-rotate based on EXIF
  3. Resize to max 1600px on the longer edge
  4. Re-encode as JPEG at quality 85
  5. Strip EXIF (privacy + size)
  6. Write to PocketBase file storage
  7. Create the receipt row in `parsing` state with `sourceType:
     'photo'`
- Tab structure in the entry sheet: `Text` / `Photo`. Camera capture
  via `<input type="file" accept="image/*" capture="environment">`.
- Photo evidence pane on the detail page: `<img>` rendering the
  normalized JPEG. Source text pane stays hidden when `sourceType =
  'photo'`.
- `tests/fixtures/gemini/maxima-receipt-typical.json` recorded.
- `tests/e2e/receipts-photo.spec.ts`: the acceptance test above for
  the photo mode.
- `CHANGELOG.md`: Phase 3 entry, what shipped, what deferred.
- `PROJECT.md`: Phase 3 marked ✓ shipped with date.
- `docs/retrospectives/phase-2.md` is currently absent; the Phase 3
  PR 5 is also a reasonable moment to write the Phase 2 retrospective
  if one would otherwise be skipped. Out of band; not a PR 5
  blocker.

## Open questions deferred to execution time

- **Prompt design.** ADR-0003 calls the prompt a durable artifact;
  the grill does not pre-design it. PR 1 ships a v1 prompt; PR 4 may
  revise it. Acceptance criterion before PR 1 merges: at least three
  real-receipt cases pass, and at least one of them is the adversarial
  Maxima with discount, loyalty-currency, and multi-quantity lines.
- **Skeleton fidelity.** Exact row count and column widths in the
  parsing skeleton. PR 4 decides; default is 5 line-item rows.
- **Empty-state copy on `/receipts`.** PR 4 default: "No receipts
  yet. Paste one to get started." After PR 5 lands: "No receipts
  yet. Paste one or snap a photo."
- **Failed-state copy.** PR 4 default: "Couldn't parse this receipt.
  Try again, or delete it."
- **Privacy page tone.** PR 4 decides. Honest, brief, link to
  ADR-0003 from the page bottom.
- **Retry-from-failed UX.** PR 4 default: single button (resets
  `parseAttempts`, transitions to `parsing`, re-fires on next render).
  Text mode could grow an "edit text before retrying" affordance
  later; defer until the simple button proves insufficient.

## References

- PROJECT.md, Phase 3 goal and success criteria
- CONTEXT.md (Receipt, Receipt photo, Receipt source text, Line item,
  receipt state machine; all amended during the 2026-05-31 grilling
  session)
- ADR-0001, stack choices (EUR only, integer cents storage, Zod)
- ADR-0003, Receipt OCR pipeline (amended in PR 1 to cover text mode)
- ADR-0006, testing strategy (TDD for pure-logic modules; Playwright
  for E2E; record-and-replay for external APIs)
- DESIGN.md, token vocabulary (Skeleton, Sheet, Tabs)
- `.claude/rules/receipts.md` (new in PR 1)
- `.claude/rules/server-actions.md` (Zod, userId scoping, error
  surfacing)
- `.claude/rules/pocketbase.md` (filter syntax, requestKey, no
  transactions)
- `.claude/rules/testing.md` (data-testid for E2E)
