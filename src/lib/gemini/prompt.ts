import { z } from "zod";

import { parsedReceiptSchema } from "@/lib/receipts/schema";

const SHARED_FIELD_RULES =
  `Field rules:

- merchant: the store name as it appears on the receipt (e.g., "Maxima", "IKI", "LIDL", "RIMI").
- date: the purchase date in YYYY-MM-DD format. If only a date range or printing date is present, use the latest applicable date.
- totalCents: the receipt's bill total in integer cents. The on-paper total of €20.08 is 2008. This is the authoritative bill total, not a computed sum.
- lineItems: every line on the receipt that contributes to or notates the total. Include products, discount lines (e.g., "ACIU nuolaida prekei: -0.80"), whole-receipt adjustments, and split-tender notations (e.g., "Atsiskaityta MAXIMOS pinigais: -0.17"). Do NOT fold per-item discounts into the product line's price; keep them as separate line items with negative lineTotalCents.

For each line item:

- name: the product or notation name as printed (preserve Lithuanian diacritics).
- quantity: integer or decimal count. Default 1 if not shown. For weighed items, use the decimal value (e.g., 0.342 for "0.342 kg bananas").
- unit: "kg", "g", "L", "ml", "vnt" (Lithuanian for "pcs"), or null when no unit is printed.
- unitPriceCents: per-unit price in integer cents, or null if not printed.
- lineTotalCents: the line's total in integer cents. Signed: positive for products, negative for discounts, refunds, and split-tender lines.

Do not invent data. If a field is genuinely absent from the receipt, use null where the schema permits and 1 for quantity. The sum of line item totals is NOT required to equal the receipt total; receipts with discounts and split tenders legitimately break that invariant.`;

/**
 * System instruction for the text-mode parse. Lithuanian-receipt-aware:
 * preserves discount and split-tender lines as their own line items
 * with negative `lineTotalCents`. Does not fold discounts into product
 * prices (the no-sum-equals-total invariant in `.claude/rules/
 * receipts.md`).
 *
 * Versioned by git history. Re-record the fixture set whenever this
 * file changes (`UPDATE_FIXTURES=true npm run test:e2e`).
 */
export const TEXT_MODE_SYSTEM_INSTRUCTION =
  `You are extracting structured data from a receipt that the user has pasted as plain text. The receipt is usually from a Lithuanian chain (Maxima Ačiū, IKI Bonus, LIDL, RIMI) and is bilingual Lithuanian / English. Return JSON that matches the response schema.

${SHARED_FIELD_RULES}`;

/**
 * System instruction for the photo-mode parse. Same field rules as
 * text mode (one Zod schema, one downstream pipeline) with a vision-
 * specific preface acknowledging the inline image.
 */
export const PHOTO_MODE_SYSTEM_INSTRUCTION =
  `You are extracting structured data from a receipt photographed by the user. The image is attached as an inline part. The receipt is usually from a Lithuanian chain (Maxima Ačiū, IKI Bonus, LIDL, RIMI) and is thermally printed in Lithuanian. Read every line carefully, preserving diacritics. Return JSON that matches the response schema.

${SHARED_FIELD_RULES}`;

/**
 * JSON Schema derived from the Zod source-of-truth, sent to Gemini as
 * `responseJsonSchema` so the model is constrained to the exact shape
 * the parse layer expects.
 */
export const PARSED_RECEIPT_JSON_SCHEMA = z.toJSONSchema(parsedReceiptSchema);
