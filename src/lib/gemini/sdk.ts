/**
 * Pinned Gemini model version. TODO before PR 3: verify against the
 * GCP console and replace with the current GA Flash dated version
 * (e.g., `gemini-3.5-flash-001`). The constant is intentionally a
 * placeholder string so any accidental live call surfaces loudly
 * rather than silently hitting a "latest" alias.
 *
 * Updates land via a deliberate PR that re-records the fixture set.
 * Never use the unversioned alias (e.g., `gemini-2.5-flash`); always
 * a dated version.
 */
export const GEMINI_MODEL = "TODO-VERIFY-IN-GCP-CONSOLE-BEFORE-PR3";

export type GeminiCallOptions = {
  signal?: AbortSignal;
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
 * SDK boundary. The real SDK call (text-only request to the pinned
 * `GEMINI_MODEL` with `responseSchema` derived from
 * `parsedReceiptSchema` and `responseMimeType: 'application/json'`)
 * lands in PR 3. PR 1 ships this stub so the parse logic can be
 * unit-tested by mocking this single function via `vi.mock('./sdk')`.
 *
 * The seam is intentionally narrow: one string in (the assembled
 * prompt body), one string out (Gemini's JSON response body). All
 * SDK client management, response_schema construction, retry policy,
 * and structured-output decoding lives behind this function.
 */
export async function callGeminiText(
  prompt: string,
  options?: GeminiCallOptions,
): Promise<string> {
  void prompt;
  void options;
  throw new GeminiResponseError(
    "upstream-error",
    "callGeminiText is not yet implemented; SDK integration lands in PR 3.",
  );
}
