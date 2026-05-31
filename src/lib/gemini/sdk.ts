import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Pinned Gemini model identifier.
 *
 * `gemini-3.5-flash` is the **bare stable identifier** Google publishes
 * for the 3.5 Flash family. It is not an unversioned alias that drifts;
 * it is the durable name of the current Stable channel. Distinct from:
 *
 *  - `gemini-3.5-flash-preview-NNNN` (Preview, not Stable)
 *  - `gemini-3.5-flash-EXP-NNNN` (Experimental, not Stable)
 *  - `gemini-3.5-flash-001`-style dated snapshots (per-revision freezes,
 *    reserved for cases where reproducibility is needed at a specific
 *    point in time)
 *
 * Update policy: bump this constant only on a deliberate PR that
 * re-runs the prompt fixture set against the new identifier. Do not
 * chase Preview channels for capability gains; the next channel
 * promotion to Stable is when we move. See ADR-0003's 2026-05-31
 * amendment for the 2.5 to 3.5 transition rationale.
 */
export const GEMINI_MODEL = "gemini-3.5-flash";

export type GeminiCallOptions = {
  signal?: AbortSignal;
  /** OpenAPI / JSON Schema describing the expected response body. */
  responseJsonSchema?: unknown;
  systemInstruction?: string;
};

export type GeminiFailureReason =
  | "invalid-json"
  | "zod-reject"
  | "upstream-error"
  | "timeout"
  | "exceeded-parse-attempts";

export class GeminiResponseError extends Error {
  constructor(
    public reason: GeminiFailureReason,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiResponseError";
  }
}

/**
 * Lazily-constructed SDK client. Construction reads `GEMINI_API_KEY`
 * from the environment exactly once; tests that mock `callGeminiText`
 * via `vi.mock('./sdk')` never hit this path and therefore do not
 * need the key set.
 */
let clientSingleton: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (clientSingleton) return clientSingleton;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiResponseError(
      "upstream-error",
      "GEMINI_API_KEY is not configured.",
    );
  }
  clientSingleton = new GoogleGenAI({ apiKey });
  return clientSingleton;
}

/**
 * SDK boundary: one text prompt in, one JSON-body string out. Mocked
 * by unit tests via `vi.mock('./sdk')`. The wider `parseReceiptText`
 * function in `./client` calls this, JSON-parses the result, and
 * Zod-validates against `parsedReceiptSchema`.
 *
 * Response shape is steered by `responseMimeType: 'application/json'`
 * plus `responseJsonSchema` (a JSON Schema derived from the Zod
 * source-of-truth schema, per ADR-0003). Errors are normalized to
 * `GeminiResponseError`; the AbortSignal is forwarded into the SDK so
 * Next request cancellations cancel the in-flight fetch cleanly.
 */
export async function callGeminiText(
  prompt: string,
  options: GeminiCallOptions = {},
): Promise<string> {
  // E2E fixture bypass. Active only when E2E_GEMINI_FIXTURE_FILE is set
  // (set by scripts/ci-e2e.sh in CI; never set in production). Reading
  // the file per call lets Playwright tests rotate the fixture between
  // tests without restarting the Next process. See
  // tests/helpers/gemini-mock.ts for the writer side.
  //
  // Required because the Gemini call originates from a Next RSC, which
  // is server-side; Playwright's `page.route()` only intercepts browser
  // fetches and would silently miss this code path.
  const fixturePath = process.env.E2E_GEMINI_FIXTURE_FILE;
  if (fixturePath) {
    return await readE2EFixture(fixturePath);
  }

  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: options.responseJsonSchema,
        systemInstruction: options.systemInstruction,
        abortSignal: options.signal,
      },
    });
    const text = response.text;
    if (typeof text !== "string" || text.length === 0) {
      throw new GeminiResponseError(
        "upstream-error",
        "Gemini returned an empty response body.",
      );
    }
    return text;
  } catch (err) {
    if (err instanceof GeminiResponseError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiResponseError(
        "timeout",
        "Gemini request was aborted.",
        err,
      );
    }
    throw new GeminiResponseError(
      "upstream-error",
      "Gemini call failed.",
      err,
    );
  }
}

/**
 * Multimodal SDK boundary: a prompt plus an inline photo (normalized
 * JPEG bytes), one JSON-body string out. Shares the E2E fixture
 * bypass with `callGeminiText` because the response shape is the
 * same (a JSON `ParsedReceipt` body); only the request differs.
 *
 * Photo bytes are base64-encoded and embedded as an `inlineData`
 * part. Gemini accepts ≤20MB per inline part, far above the 5MB
 * cap we enforce on the stored photo.
 */
export async function callGeminiPhoto(
  prompt: string,
  photo: { mimeType: string; bytes: Buffer | Uint8Array },
  options: GeminiCallOptions = {},
): Promise<string> {
  const fixturePath = process.env.E2E_GEMINI_FIXTURE_FILE;
  if (fixturePath) {
    return await readE2EFixture(fixturePath);
  }

  const photoBytes = photo.bytes instanceof Buffer
    ? photo.bytes
    : Buffer.from(photo.bytes);

  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: photo.mimeType,
                data: photoBytes.toString("base64"),
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: options.responseJsonSchema,
        systemInstruction: options.systemInstruction,
        abortSignal: options.signal,
      },
    });
    const text = response.text;
    if (typeof text !== "string" || text.length === 0) {
      throw new GeminiResponseError(
        "upstream-error",
        "Gemini returned an empty response body.",
      );
    }
    return text;
  } catch (err) {
    if (err instanceof GeminiResponseError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiResponseError(
        "timeout",
        "Gemini request was aborted.",
        err,
      );
    }
    throw new GeminiResponseError(
      "upstream-error",
      "Gemini multimodal call failed.",
      err,
    );
  }
}

async function readE2EFixture(path: string): Promise<string> {
  try {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile(path, "utf-8");
    if (!body) {
      throw new GeminiResponseError(
        "upstream-error",
        "E2E fixture file is empty.",
      );
    }
    return body;
  } catch (err) {
    if (err instanceof GeminiResponseError) throw err;
    throw new GeminiResponseError(
      "upstream-error",
      `E2E fixture not readable: ${path}`,
      err,
    );
  }
}
