import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

/**
 * The path the Next.js process reads when `E2E_GEMINI_FIXTURE_FILE`
 * is set in its env (see `scripts/ci-e2e.sh`). Tests write the
 * desired fixture body here before triggering the parse, and clear
 * the file in afterEach so a missing setup surfaces loudly rather
 * than silently reusing the previous test's mock.
 *
 * The bypass lives at the SDK boundary in `src/lib/gemini/sdk.ts`.
 * Playwright `page.route()` is NOT used because the Gemini call
 * originates from a server-side RSC, which never goes through the
 * browser's network layer.
 */
export const E2E_GEMINI_FIXTURE_FILE = process.env.E2E_GEMINI_FIXTURE_FILE ??
  "/tmp/centfolio-e2e-gemini.json";

/**
 * Write a synthetic `ParsedReceipt` body to the fixture file. The
 * RSC's next call to `parseReceiptText` will read it and treat it as
 * the Gemini response.
 */
export async function setGeminiHappy(parsedReceipt: {
  merchant: string;
  date: string;
  totalCents: number;
  lineItems: Array<{
    name: string;
    quantity?: number;
    unit?: string | null;
    unitPriceCents?: number | null;
    lineTotalCents: number;
  }>;
}) {
  await mkdir(path.dirname(E2E_GEMINI_FIXTURE_FILE), { recursive: true });
  await writeFile(E2E_GEMINI_FIXTURE_FILE, JSON.stringify(parsedReceipt));
}

/**
 * Write a body that fails the parse layer: not valid JSON. Surfaces
 * as `GeminiResponseError` with reason `invalid-json` and the
 * receipt transitions to `failed`.
 */
export async function setGeminiMalformed() {
  await mkdir(path.dirname(E2E_GEMINI_FIXTURE_FILE), { recursive: true });
  await writeFile(E2E_GEMINI_FIXTURE_FILE, "not json at all");
}

/**
 * Clear the fixture file. Call in afterEach so a missing setGemini*
 * call in the next test surfaces as a clear "fixture not readable"
 * error rather than silently replaying the prior test's body.
 */
export async function clearGeminiFixture() {
  await rm(E2E_GEMINI_FIXTURE_FILE, { force: true });
}
