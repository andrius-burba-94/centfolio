import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseReceiptText } from "./client";
import { GeminiResponseError } from "./sdk";

vi.mock("./sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sdk")>();
  return {
    ...actual,
    callGeminiText: vi.fn(),
  };
});

const { callGeminiText } = await import("./sdk");
const mockedCall = vi.mocked(callGeminiText);

const validReceiptJson = JSON.stringify({
  merchant: "Maxima",
  date: "2026-05-31",
  totalCents: 2008,
  lineItems: [
    { name: "Pienas 1L", lineTotalCents: 129 },
    { name: "Duona", lineTotalCents: 250 },
    {
      name: "ACIU nuolaida prekei",
      lineTotalCents: -80,
    },
  ],
});

describe("parseReceiptText", () => {
  beforeEach(() => {
    mockedCall.mockReset();
  });

  it("returns a validated ParsedReceipt for a well-formed response", async () => {
    mockedCall.mockResolvedValueOnce(validReceiptJson);
    const result = await parseReceiptText("any text");
    expect(result.merchant).toBe("Maxima");
    expect(result.totalCents).toBe(2008);
    expect(result.lineItems).toHaveLength(3);
    expect(result.lineItems[2].lineTotalCents).toBe(-80);
  });

  it("forwards the assembled prompt and options to the SDK boundary", async () => {
    mockedCall.mockResolvedValueOnce(validReceiptJson);
    const signal = new AbortController().signal;
    await parseReceiptText("paste body here", { signal });
    expect(mockedCall).toHaveBeenCalledOnce();
    const [prompt, options] = mockedCall.mock.calls[0];
    expect(prompt).toContain("paste body here");
    expect(options).toEqual({ signal });
  });

  it("throws GeminiResponseError with reason 'invalid-json' on non-JSON output", async () => {
    mockedCall.mockResolvedValueOnce("not json at all");
    await expect(parseReceiptText("any")).rejects.toMatchObject({
      name: "GeminiResponseError",
      reason: "invalid-json",
    });
  });

  it("throws GeminiResponseError with reason 'zod-reject' on schema mismatch", async () => {
    mockedCall.mockResolvedValueOnce(
      JSON.stringify({
        merchant: "Maxima",
        date: "31/05/2026",
        totalCents: 2008,
        lineItems: [{ name: "Pienas", lineTotalCents: 129 }],
      }),
    );
    await expect(parseReceiptText("any")).rejects.toMatchObject({
      name: "GeminiResponseError",
      reason: "zod-reject",
    });
  });

  it("rethrows a GeminiResponseError raised by the SDK boundary untouched", async () => {
    const upstream = new GeminiResponseError(
      "timeout",
      "Gemini timed out",
    );
    mockedCall.mockRejectedValueOnce(upstream);
    await expect(parseReceiptText("any")).rejects.toBe(upstream);
  });

  it("wraps an unknown SDK error as 'upstream-error'", async () => {
    mockedCall.mockRejectedValueOnce(new Error("network down"));
    await expect(parseReceiptText("any")).rejects.toMatchObject({
      name: "GeminiResponseError",
      reason: "upstream-error",
    });
  });
});
