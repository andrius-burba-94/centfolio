---
paths:
  - "src/lib/categorization/**"
  - "src/lib/rules/**"
  - "src/app/(app)/transactions/needs-review/**"
  - "tests/fixtures/categorization/**"
---

# Categorization

Captures the rules earned during the Phase 4 grilling session. The
categorization pipeline applies to **every uncategorized
transaction**, whether synced from a bank (Phase 4+), entered
manually (Phase 2), or pulled from a confirmed receipt's line items
(post-Phase 5). Rules below apply regardless of origin.

## Pipeline priority is locked

Per `CONTEXT.md`, categorization runs in this order, first match
wins:

1. **Rule-based**: user-defined payee pattern matches.
   `categorizationSource = 'rule'`.
2. **AI high-confidence**: Gemini returns a suggestion with
   `confidence >= 0.85`. `categorizationSource = 'ai'`.
3. **AI low-confidence with review**: Gemini returns a suggestion
   with `confidence < 0.85`. Stored on the row, but the
   transaction stays uncategorized. User accepts via the Needs
   review surface, at which point `categorizationSource =
   'ai-reviewed'`.
4. **Manual**: user picks directly. Always wins. Overrides any
   prior source.

A new rule creation recategorizes a user's existing transactions
**only** if their `categorizationSource IN (NULL, 'ai')`. Manual
and `ai-reviewed` rows are never touched: the user already
decided.

**High-confidence AI is silent.** Rows with
`categorizationSource = 'ai'` (auto-applied at confidence >= 0.85)
do NOT surface in Needs review. The threshold is the contract; if
every AI decision needed re-confirmation, the threshold would be
meaningless. The safety valve is that `categorizationSource` is
preserved on every row, so a future "show me all my AI-categorized
transactions" filter is a one-line addition when it earns its
keep. Do not extend Needs review to include AI-applied rows.

## AI categorization is batched, never per-transaction

`runSyncForUser` collects all uncategorized rule-misses for the
user, then issues **one batched Gemini call** per chunk of 50
transactions. Per-transaction calls scale sync latency with new
volume and are explicitly rejected; the manual `Sync now` button
must stay under ~10 seconds total for normal-volume syncs.

The batched call sends:

- The user's full category list as printed names with parent path
  (e.g., `"Food > Groceries"`, `"Bills > Subscriptions"`). Names
  are what the model can reason about; PB IDs would just confuse.
- The unmatched transactions as a numbered list with payee, amount,
  date.
- A `responseJsonSchema` derived from
  `src/lib/categorization/schema.ts` via `z.toJSONSchema()`. Same
  pattern as Phase 3 receipts.

Response shape:

```typescript
{
  suggestions: [
    { index: 0, categoryName: "Food > Groceries", confidence: 0.95 },
    { index: 1, categoryName: null, confidence: 0.0 },  // no good match
    ...
  ]
}
```

## Defensive index handling on apply

Never assume the response array positionally aligns with the input
array. Gemini can return fewer suggestions than requested, reorder,
or skip entries silently. The apply loop must:

1. Key off the returned `index` field, not position.
2. Validate `index` is in range of the input batch; ignore
   out-of-range indices.
3. Treat missing indices as "no suggestion this round": the
   transaction stays uncategorized and is re-queried next sync
   (see stale-retry below).
4. Resolve `categoryName` to a category ID server-side. If no
   user-owned category matches the name (hallucination, typo),
   discard the suggestion for that transaction.

## Batch size cap

Chunk uncategorized transactions into groups of 50 before issuing
Gemini calls. Reasons:

- **Initial-connect / catch-up windows** can produce tens to
  hundreds of uncategorized rows in one sync even with ADR-0005's
  no-historical-backfill rule (Reconnect-then-first-sync, manual
  rule-creation triggering a sweep, an extended Gemini outage
  followed by a recovery sync).
- **Response-JSON discipline degrades** at large batches; 50 is
  comfortably inside Gemini Flash's robust output zone.
- **Failure blast radius** is bounded: a malformed response on
  one chunk only retries that chunk's 50, not the entire backlog.
- **Sequential**, not parallel. Parallel adds nothing at v1 scale
  and risks tripping per-key rate limits without recovery logic.

The chunk size lives as a constant
(`CATEGORIZATION_BATCH_SIZE = 50`) in
`src/lib/categorization/run.ts`. Not user-configurable.

## Stale-retry, not permanent skip

If Gemini's previous suggestion for an uncategorized transaction
was low-confidence (`< 0.85`, stored on the row), the next sync
re-queries it only when:

- `aiSuggestionAt` is null (never queried), OR
- `aiSuggestionAt` is more than 30 days old (suggestion may be
  stale relative to a refreshed prompt or an expanded category
  list).

Otherwise the row sits with its stored suggestion. The user can
accept it via Needs review, or it ages out and gets re-queried.

This prevents two failure modes:

- A hopeless payee getting re-queried every sync forever.
- A reasonable payee getting permanently stuck at a low-confidence
  suggestion that a refreshed prompt would now classify
  confidently.

## Redaction policy for `logError`

The categorization prompt sends transaction payees to Gemini.
Payees can be third-party PII (private individuals on P2P
transfers, employer names on salary deposits). If a Gemini call
fails and `logError` captures the prompt body, that PII ships to
Sentry. The whitelist policy from `.claude/rules/bank-sync.md`
applies in mirror form.

The helper `scrubCategorizationContext(ctx)` in
`src/lib/categorization/log.ts` accepts an unscrubbed context
object and returns a new object containing only the
explicitly-allowed keys.

**Allowed in `ctx` for any `logError` in the categorization
pipeline:**

- Our internal IDs: `userId`, PB `transactionId` (or an array of
  them for batch failures)
- Batch metadata: `batchSize`, `chunkIndex`, `totalChunks`
- Model identifier (`GEMINI_MODEL` constant)
- HTTP status code, Gemini error code
- Failure category (`"timeout"` | `"invalid-json"` | `"zod-reject"`
  | `"upstream-error"`)
- Error class name and a sanitized error message
- `trigger` (`"cron"` | `"manual"`) passed through from
  `runSyncForUser`
- Timestamps

**Forbidden (must never reach `logError`):**

- The prompt body or any portion of it.
- Transaction payees in plain text.
- The user's category list as printed in the prompt.
- The Gemini response body if it failed validation (could contain
  user data echoed back).

Internal IDs let us correlate "this specific transaction failed
categorization" without exposing what was in it. If we need to
debug why a specific payee fails, that's a manual reproduction
against the GC sandbox with logs disabled, not a Sentry breadcrumb.

## No failure state for categorization

If a Gemini call fails (timeout, malformed JSON, Zod reject, API
error), the affected transactions stay uncategorized with whatever
prior `aiSuggestion*` fields they had. The error is logged via
`logError`; the sync run completes successfully from the user's
perspective. The next sync run retries naturally because every
uncategorized rule-miss is in the candidate set.

Do not mark transactions as `failed` for AI-categorization
failures. `failed` is a receipts concept; transactions don't
carry a failure state.
