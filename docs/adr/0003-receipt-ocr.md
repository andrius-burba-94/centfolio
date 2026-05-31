# ADR-0003: Receipt OCR pipeline

- Status: Accepted (amended 2026-05-31)
- Date: 2026-05-18
- Deciders: Andrius

## Context

The match is Centfolio's wedge: the bank says "Maxima €34.27" and
the receipt says €8 was wine and €4 was oat milk. That only works if
a photograph of a Lithuanian grocery receipt reliably becomes
structured data — merchant, date, total, and a list of line items
with quantities and unit prices.

The OCR has to handle the formats that actually exist in the user's
wallet: Maxima, IKI, LIDL, RIMI, plus the occasional restaurant
receipt. These vary in layout, language (Lithuanian, sometimes
English), thermal-print quality, and how line items are abbreviated.
The success criterion in `PROJECT.md` Phase 3 is 90% correct
extraction on a typical receipt, with the remaining 10% correctable
in under a minute.

The pipeline runs on a single VPS with no GPU. There is no budget for
running a vision model locally, and the volume (one user, a handful
of receipts per week in v1) does not justify standing one up even if
there were.

## Decision

Centfolio sends the receipt photo directly to Gemini 2.5 Flash. The
response is constrained by Gemini's structured-output mode
(`responseSchema` + `responseMimeType: 'application/json'`) and then
validated by Zod on our side. The Zod schema is the source of truth;
the OpenAPI schema sent to Gemini is derived from it.

There is no separate OCR step. The image goes to Gemini, and Gemini
returns `{ merchant, date, total, lineItems: [...] }` in one call.
The result lands in PocketBase in `parsed` state; the user then
confirms or edits it before the receipt becomes `confirmed`.

## Alternatives considered

**Tesseract or another classical OCR, then a separate parsing step.**
Free, runs locally, no API dependency. Rejected because classical OCR
on thermal receipts is poor — accuracy on Lithuanian text with
diacritics and abbreviated line items is well below 90% before any
structuring work, and the structuring step (raw text → line items) is
itself a hard problem we'd then be solving from scratch.

**Google Document AI or AWS Textract receipt parsers.** Purpose-built
for this. Rejected because both are tuned for English-language US
receipts; Lithuanian merchants and Baltic formats fall outside their
strongest coverage, and the pricing model assumes higher volumes than
Centfolio has.

**GPT-4o or Claude with vision.** Both can do this job to a similar
quality bar. Rejected because Gemini 2.5 Flash is materially cheaper
per request at the latency Centfolio needs, and the
`responseSchema` mode produces strictly-typed JSON without a parsing
layer. The model choice is reversible — the schema and the prompt are
the durable artifacts — so we pick the cheapest model that clears the
quality bar today.

**Local vision model (e.g. LLaVA, Qwen-VL on the VPS).** Rejected:
the VPS has no GPU, CPU inference at acceptable quality is too slow
for an interactive upload flow, and the inference cost would dominate
the rest of the application's resource budget.

## Consequences

- **Good:** One network call, one cost line, one error path. The
  pipeline is small enough to reason about end-to-end.
- **Good:** Structured output via `responseSchema` removes a whole
  category of failure modes (model returns prose, model returns JSON
  with a trailing comma, model invents fields). Zod validates on the
  way in and bad responses fail loudly rather than silently
  corrupting a receipt.
- **Good:** Per-receipt cost is low enough that v1's volume is
  effectively free. Cost only becomes a real factor at v2 scale.
- **Bad:** Receipt photos leave the VPS and reach Google. The user
  has to be told this clearly at upload time, and the privacy posture
  in v1's invite-only context has to acknowledge it. The disclosure
  copy and any opt-out mechanism are left to Phase 3 implementation —
  this ADR records the data flow, not the user-facing policy.
- **Bad:** Quality regressions in Gemini are felt directly. If a
  future model version handles Lithuanian receipts worse, Centfolio's
  match flow degrades with no recourse inside the codebase. Pinning
  to a specific model version (not just `gemini-2.5-flash`) and
  versioning the prompt mitigate but don't eliminate this.
- **Neutral:** All receipt photos are retained in PocketBase storage
  per `CONTEXT.md` ("Receipt photo … never discarded"). This means
  re-running extraction against a future model is always an option.

## Amendments

### 2026-05-31, Phase 3 grilling outcomes

The architecture grilling session for Phase 3 surfaced three
additions to the original decision. None of them invalidates the
"one network call, structured output, Zod validation" core; they
extend the surface.

**Two input modes, not one.** In addition to the photo path, the
user may paste the body of a machine-readable receipt email
(Maxima Ačiū, IKI Bonus) directly. Both modes hit Gemini with the
same `responseSchema` derived from the same Zod schema, and both
produce the same `ParsedReceipt` shape downstream. The fork is only
at the input boundary:

- `parseReceiptText(text)` issues a text-only Gemini call.
- `parseReceiptPhoto(buffer)` issues a multimodal call with the
  normalized JPEG inline. Photo arrives at this function after the
  `sharp` normalization pipeline (decode, EXIF rotate, resize to
  1600px long-edge, JPEG quality 85, EXIF strip).

The text path is materially cheaper (no vision tokens, smaller
context). The two functions converge immediately on the same Zod
validation and the same downstream pipeline.

**`sourceType` enum and `sourceText` audit field.** The receipt
row carries `sourceType: 'photo' | 'text'` and, when `sourceType =
'text'`, a `sourceText` field holding the raw pasted body. The
text source is preserved for the same audit reason as the photo
(CONTEXT.md "never discarded"): if Gemini's parse was wrong, the
original is available for review or re-parsing under a revised
prompt.

**Model version pinning, with quarterly review.** ADR-0003's
original body names "Gemini 2.5 Flash"; the pin is implemented as a
`GEMINI_MODEL` constant in `src/lib/gemini/client.ts`, currently
set to the current GA Flash model (verified against the GCP console
at PR 1 time). The constant updates only on a deliberate PR that
re-runs the prompt regression fixtures; "follow latest" string
forms like `gemini-2.5-flash` (without a date suffix) are not used.
Review the pin quarterly and on any reported parse-quality
regression. The model choice remains reversible per the original
decision; the prompt and the Zod schema are the durable artifacts.

## References

- `PROJECT.md`, Phase 3 success criteria
- `CONTEXT.md`, `Receipt`, `Receipt source text`, `Line item`, and
  the receipt state machine (all amended during the 2026-05-31
  grilling session)
- `docs/adr/0001-stack.md`, Zod is part of the stack; this ADR
  assumes it
- `docs/plans/phase-3-receipts.md`, the implementation plan that
  references this amendment
- `.claude/rules/receipts.md`, captures the discipline rules
  (parseAttempts cap, Suspense contract, fixture scrub) that flow
  from the decisions here
