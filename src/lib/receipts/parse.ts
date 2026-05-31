import "server-only";

import { requireAuthenticatedPb } from "@/lib/auth/session";
import { parseReceiptText } from "@/lib/gemini/client";
import {
  GeminiResponseError,
  type GeminiFailureReason,
} from "@/lib/gemini/sdk";
import { logError } from "@/lib/log/logError";

import { getReceipt } from "./queries";
import { toLineItem, toReceipt } from "./record";
import {
  PARSE_ATTEMPTS_CAP,
  type ReceiptWithLineItems,
} from "./types";

/**
 * Called by the detail-page RSC at render time. Walks the parsing
 * state machine: if `status` is `parsing` AND `parseAttempts <
 * PARSE_ATTEMPTS_CAP`, increments attempts (before firing, per
 * `.claude/rules/receipts.md`), invokes Gemini, and writes either
 * `parsed` (with merchant/date/totalCents and the lineItems rows) or
 * `failed` (with a `failureReason`). If the receipt is already past
 * `parsing`, returns it unchanged.
 *
 * Never throws to the caller. Gemini failures are written to the
 * row as data and the failed-state UI renders from that. Suspense
 * sees only loading-fallback semantics; ErrorBoundary is not
 * needed (per the Suspense contract in `.claude/rules/receipts.md`).
 */
export async function parseReceiptIfNeeded(
  receiptId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ReceiptWithLineItems | null> {
  const initial = await getReceipt(receiptId);
  if (!initial) return null;
  if (initial.status !== "parsing") return initial;

  if (initial.parseAttempts >= PARSE_ATTEMPTS_CAP) {
    return markFailed(receiptId, "exceeded-parse-attempts");
  }

  if (!initial.sourceText || initial.sourceText.length === 0) {
    return markFailed(receiptId, "upstream-error", "No source text on row.");
  }

  // Increment attempts BEFORE firing Gemini. Abandoned tabs count
  // against the cap; this is the bot-crawler ceiling.
  await incrementAttempts(receiptId, initial.parseAttempts + 1);

  try {
    const parsed = await parseReceiptText(initial.sourceText, {
      signal: options.signal,
    });

    const { pb, user } = await requireAuthenticatedPb();

    // Wipe any line items from a prior attempt (defensive; should be
    // empty on a fresh parsing row, but a previous successful parse
    // followed by an explicit retry could leave rows behind).
    const existing = await pb.collection("lineItems").getFullList({
      filter: `receiptId = '${receiptId}'`,
    });
    for (const row of existing) {
      await pb.collection("lineItems").delete(String(row.id));
    }

    let position = 0;
    for (const item of parsed.lineItems) {
      await pb.collection("lineItems").create({
        userId: user.id,
        receiptId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        position,
      });
      position += 1;
    }

    const updated = await pb.collection("receipts").update(receiptId, {
      userId: user.id,
      status: "parsed",
      merchant: parsed.merchant,
      date: parsed.date,
      totalCents: parsed.totalCents,
      failureReason: "",
    });

    const lineItems = (await pb.collection("lineItems").getFullList({
      filter: `receiptId = '${receiptId}'`,
      sort: "position",
    })).map(toLineItem);

    return { ...toReceipt(updated), lineItems };
  } catch (err) {
    const reason: GeminiFailureReason = err instanceof GeminiResponseError
      ? err.reason
      : "upstream-error";
    logError(err, {
      action: "parseReceiptIfNeeded",
      receiptId,
      reason,
    });
    return markFailed(receiptId, reason);
  }
}

async function incrementAttempts(
  receiptId: string,
  next: number,
): Promise<void> {
  const { pb, user } = await requireAuthenticatedPb();
  await pb.collection("receipts").update(receiptId, {
    userId: user.id,
    parseAttempts: next,
  });
}

async function markFailed(
  receiptId: string,
  reason: GeminiFailureReason,
  detail?: string,
): Promise<ReceiptWithLineItems | null> {
  const { pb, user } = await requireAuthenticatedPb();
  try {
    const updated = await pb.collection("receipts").update(receiptId, {
      userId: user.id,
      status: "failed",
      failureReason: detail ? `${reason}: ${detail}` : reason,
    });
    return { ...toReceipt(updated), lineItems: [] };
  } catch (err) {
    logError(err, {
      action: "parseReceipt.markFailed",
      receiptId,
      reason,
    });
    return null;
  }
}
