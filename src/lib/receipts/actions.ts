"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedPb } from "@/lib/auth/session";
import { logError } from "@/lib/log/logError";
import { pbErrorMessage } from "@/lib/pocketbase/error";

import type { ActionResult } from "@/lib/categories/actions";

import {
  normalizeReceiptPhoto,
  RAW_UPLOAD_MAX_BYTES,
} from "./photo";
import { lineItemSchema } from "./schema";

const createFromTextSchema = z.object({
  text: z.string().trim().min(1).max(50000),
});

export async function createReceiptFromText(input: {
  text: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = createFromTextSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Paste the body of the receipt email to get started.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();
  try {
    const created = await pb.collection("receipts").create({
      userId: user.id,
      status: "parsing",
      sourceType: "text",
      sourceText: parsed.data.text,
      parseAttempts: 0,
    });
    revalidatePath("/receipts");
    return { ok: true, data: { id: String(created.id) } };
  } catch (err) {
    logError(err, { action: "createReceiptFromText", userId: user.id });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to save receipt."),
    };
  }
}

const ACCEPTED_PHOTO_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function createReceiptFromPhoto(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Select a photo of the receipt to upload." };
  }
  if (file.size > RAW_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      error: "Photo is larger than 15 MB. Try a smaller image.",
    };
  }
  if (file.type && !ACCEPTED_PHOTO_MIMES.has(file.type)) {
    return {
      ok: false,
      error: "Unsupported photo format. Use JPEG, PNG, WebP, or HEIC.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const normalized = await normalizeReceiptPhoto(buffer);
    const normalizedFile = new File([new Uint8Array(normalized.buffer)], "receipt.jpg", {
      type: "image/jpeg",
    });

    const payload = new FormData();
    payload.set("userId", user.id);
    payload.set("status", "parsing");
    payload.set("sourceType", "photo");
    payload.set("parseAttempts", "0");
    payload.set("photo", normalizedFile);

    const created = await pb.collection("receipts").create(payload);
    revalidatePath("/receipts");
    return { ok: true, data: { id: String(created.id) } };
  } catch (err) {
    logError(err, { action: "createReceiptFromPhoto", userId: user.id });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to save receipt."),
    };
  }
}

const idSchema = z.object({ id: z.string().min(1) });

/**
 * Resets `parseAttempts` to 0 and `status` to `parsing` server-side.
 * The client never supplies a reset value (see
 * `.claude/rules/receipts.md`). The detail page RSC re-fires Gemini
 * on the next render once status is back to `parsing`.
 */
export async function retryParse(input: {
  id: string;
}): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid receipt id." };

  const { pb, user } = await requireAuthenticatedPb();
  try {
    const record = await pb.collection("receipts").getOne(parsed.data.id);
    if (String(record.userId) !== user.id) {
      return { ok: false, error: "Receipt not found." };
    }
    await pb.collection("receipts").update(parsed.data.id, {
      userId: user.id,
      status: "parsing",
      parseAttempts: 0,
      failureReason: "",
    });
    revalidatePath(`/receipts/${parsed.data.id}`);
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "retryParse",
      userId: user.id,
      receiptId: parsed.data.id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to retry parse."),
    };
  }
}

const confirmSchema = z.object({
  id: z.string().min(1),
  merchant: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  totalCents: z.number().int(),
  lineItems: z.array(
    z.object({
      id: z.string().min(1).optional(),
      ...lineItemSchema.shape,
      position: z.number().int().min(0),
    }),
  ).min(1),
});

export async function confirmReceipt(
  input: z.input<typeof confirmSchema>,
): Promise<ActionResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the receipt details and try again.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();
  const { id, merchant, date, totalCents, lineItems } = parsed.data;

  try {
    const record = await pb.collection("receipts").getOne(id);
    if (String(record.userId) !== user.id) {
      return { ok: false, error: "Receipt not found." };
    }

    // Existing line items: delete those not in the submitted payload,
    // update those that were submitted with their id, create the rest.
    const existing = await pb.collection("lineItems").getFullList({
      filter: `receiptId = '${id}'`,
    });
    const submittedIds = new Set(
      lineItems.map((li) => li.id).filter(Boolean) as string[],
    );

    for (const existingItem of existing) {
      if (!submittedIds.has(String(existingItem.id))) {
        await pb.collection("lineItems").delete(String(existingItem.id));
      }
    }

    for (const item of lineItems) {
      const payload = {
        userId: user.id,
        receiptId: id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        position: item.position,
      };
      if (item.id && existing.some((e) => String(e.id) === item.id)) {
        await pb.collection("lineItems").update(item.id, payload);
      } else {
        await pb.collection("lineItems").create(payload);
      }
    }

    await pb.collection("receipts").update(id, {
      userId: user.id,
      status: "confirmed",
      merchant,
      date,
      totalCents,
    });

    revalidatePath(`/receipts/${id}`);
    revalidatePath("/receipts");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "confirmReceipt",
      userId: user.id,
      receiptId: id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to confirm receipt."),
    };
  }
}

export async function deleteReceipt(input: {
  id: string;
}): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid receipt id." };

  const { pb, user } = await requireAuthenticatedPb();
  try {
    const record = await pb.collection("receipts").getOne(parsed.data.id);
    if (String(record.userId) !== user.id) {
      return { ok: false, error: "Receipt not found." };
    }
    await pb.collection("receipts").delete(parsed.data.id);
    revalidatePath("/receipts");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "deleteReceipt",
      userId: user.id,
      receiptId: parsed.data.id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to delete receipt."),
    };
  }
}
