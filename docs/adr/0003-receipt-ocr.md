# ADR-0003: Receipt OCR pipeline

- Status: Accepted
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

## References

- `PROJECT.md` — Phase 3 success criteria
- `CONTEXT.md` — `Receipt`, `Line item`, and the receipt state machine
- `docs/adr/0001-stack.md` — Zod is part of the stack; this ADR
  assumes it
