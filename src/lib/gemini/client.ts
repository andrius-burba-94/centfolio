import {
  parsedReceiptSchema,
  type ParsedReceipt,
} from "@/lib/receipts/schema";

import {
  callGeminiText,
  GeminiResponseError,
  type GeminiCallOptions,
} from "./sdk";

/**
 * v1 system prompt. TODO before PR 3: iterate against the real
 * adversarial Maxima fixture (discount lines, MAXIMOS pinigais
 * split-tender, multi-quantity). Acceptance per the plan: at least
 * three real-receipt cases pass, including one adversarial case.
 *
 * The prompt is deliberately bilingual-aware (Lithuanian receipt
 * with Lithuanian field names) and asks Gemini to preserve discount
 * and split-tender lines as their own line items with negative
 * `lineTotalCents`. The Zod schema admits the negative totals and
 * the line-item-sum invariant is explicitly not enforced (see
 * `.claude/rules/receipts.md`).
 */
const TEXT_MODE_SYSTEM_PROMPT =
  "TODO PR 3: draft v1 prompt against real Lithuanian receipt fixtures.";

/**
 * Parse the body of a pasted email receipt (text mode). Returns a
 * Zod-validated `ParsedReceipt`. Throws `GeminiResponseError` on any
 * failure; the caller (the detail-page RSC) catches and writes the
 * `failureReason` to the receipt row, then re-renders the failed-
 * state UI. The caller never lets the thrown error reach the Suspense
 * boundary (per `.claude/rules/receipts.md`).
 */
export async function parseReceiptText(
  text: string,
  options: GeminiCallOptions = {},
): Promise<ParsedReceipt> {
  const prompt = `${TEXT_MODE_SYSTEM_PROMPT}\n\n${text}`;

  let raw: string;
  try {
    raw = await callGeminiText(prompt, options);
  } catch (err) {
    if (err instanceof GeminiResponseError) throw err;
    throw new GeminiResponseError(
      "upstream-error",
      "Gemini call failed",
      err,
    );
  }

  let asJson: unknown;
  try {
    asJson = JSON.parse(raw);
  } catch (err) {
    throw new GeminiResponseError(
      "invalid-json",
      "Gemini returned a body that is not valid JSON",
      err,
    );
  }

  const result = parsedReceiptSchema.safeParse(asJson);
  if (!result.success) {
    throw new GeminiResponseError(
      "zod-reject",
      "Gemini response did not match the ParsedReceipt schema",
      result.error,
    );
  }

  return result.data;
}

export {
  GEMINI_MODEL,
  GeminiResponseError,
  type GeminiCallOptions,
  type GeminiFailureReason,
} from "./sdk";
