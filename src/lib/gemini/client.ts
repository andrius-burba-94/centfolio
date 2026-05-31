import {
  parsedReceiptSchema,
  type ParsedReceipt,
} from "@/lib/receipts/schema";

import {
  PARSED_RECEIPT_JSON_SCHEMA,
  TEXT_MODE_SYSTEM_INSTRUCTION,
} from "./prompt";
import {
  callGeminiText,
  GeminiResponseError,
  type GeminiCallOptions,
} from "./sdk";

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
  options: Pick<GeminiCallOptions, "signal"> = {},
): Promise<ParsedReceipt> {
  let raw: string;
  try {
    raw = await callGeminiText(text, {
      signal: options.signal,
      systemInstruction: TEXT_MODE_SYSTEM_INSTRUCTION,
      responseJsonSchema: PARSED_RECEIPT_JSON_SCHEMA,
    });
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
