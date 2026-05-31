import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page, Route } from "@playwright/test";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures/gemini");
const UPDATE_FIXTURES = process.env.UPDATE_FIXTURES === "true";
const GEMINI_HOST_PATTERN =
  "**/generativelanguage.googleapis.com/**/*generateContent*";

export type GeminiFixture = {
  /**
   * Path under `tests/fixtures/gemini/`, without the `.json` suffix.
   * Examples: `iki-email-typical`, `maxima-receipt-typical`,
   * `iki-malformed` (for the failed-state path).
   */
  name: string;
};

/**
 * Installs a Playwright route handler that intercepts every
 * Gemini `generateContent` call and replays the named fixture.
 * Records on first run if `UPDATE_FIXTURES=true`. See
 * `.claude/rules/receipts.md` for the discipline rules around
 * fixture provenance and PII scrubbing.
 */
export async function mockGemini(page: Page, fixture: GeminiFixture) {
  const fixturePath = path.join(FIXTURES_DIR, `${fixture.name}.json`);

  await page.route(GEMINI_HOST_PATTERN, async (route: Route) => {
    if (UPDATE_FIXTURES) {
      // Pass through to real Gemini, then record the response.
      const response = await route.fetch();
      const body = await response.text();
      await mkdir(FIXTURES_DIR, { recursive: true });
      await writeFile(fixturePath, body);
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body,
      });
      return;
    }

    let body: string;
    try {
      body = await readFile(fixturePath, "utf-8");
    } catch {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            message: `Missing fixture: ${fixture.name}. Run with UPDATE_FIXTURES=true to record.`,
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
    });
  });
}

/**
 * Convenience for the failed-state test path: fulfill with a body
 * that is plausibly Gemini-shaped but contains malformed JSON in
 * the `text` part. The parse layer in `src/lib/gemini/client.ts`
 * surfaces this as `GeminiResponseError` with reason `invalid-json`.
 */
export async function mockGeminiMalformed(page: Page) {
  await page.route(GEMINI_HOST_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "not json at all" }],
              role: "model",
            },
            finishReason: "STOP",
          },
        ],
      }),
    }),
  );
}
