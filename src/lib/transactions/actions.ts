"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedPb } from "@/lib/auth/session";
import { logError } from "@/lib/log/logError";
import { pbErrorMessage } from "@/lib/pocketbase/error";

import type { ActionResult } from "@/lib/categories/actions";

import { toTransaction } from "./record";
import type { Transaction } from "./types";

const baseFields = {
  merchantName: z.string().trim().min(1).max(200),
  amount: z.number().int(),
  date: z.string().min(1),
  description: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  categoryId: z.string().min(1).optional().nullable(),
  tagIds: z.array(z.string().min(1)).optional().default([]),
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({ id: z.string().min(1), ...baseFields });
const deleteSchema = z.object({ id: z.string().min(1) });

type ValidatedFields = z.infer<typeof createSchema>;

function buildPayload(input: ValidatedFields, userId: string) {
  const payload: Record<string, unknown> = {
    merchantName: input.merchantName,
    amount: input.amount,
    date: input.date,
    description: input.description ?? "",
    notes: input.notes ?? "",
    tagIds: input.tagIds ?? [],
    userId,
  };
  if (input.categoryId) {
    payload.categoryId = input.categoryId;
  }
  return payload;
}

export type CreateTransactionInput = {
  merchantName: string;
  amount: number;
  date: string;
  description?: string;
  notes?: string;
  categoryId?: string | null;
  tagIds?: string[];
};

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<ActionResult<Transaction>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const { pb, user } = await requireAuthenticatedPb();

  try {
    const created = await pb
      .collection("transactions")
      .create(buildPayload(parsed.data, user.id));
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true, data: toTransaction(created) };
  } catch (err) {
    logError(err, { action: "createTransaction", userId: user.id });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to save transaction."),
    };
  }
}

export type UpdateTransactionInput = CreateTransactionInput & { id: string };

export async function updateTransaction(
  input: UpdateTransactionInput,
): Promise<ActionResult<Transaction>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const { pb, user } = await requireAuthenticatedPb();
  const { id, ...rest } = parsed.data;

  try {
    const updated = await pb
      .collection("transactions")
      .update(id, buildPayload(rest as ValidatedFields, user.id));
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true, data: toTransaction(updated) };
  } catch (err) {
    logError(err, {
      action: "updateTransaction",
      userId: user.id,
      transactionId: id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to update transaction."),
    };
  }
}

export async function deleteTransaction(input: {
  id: string;
}): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid transaction id." };

  const { pb, user } = await requireAuthenticatedPb();

  try {
    await pb.collection("transactions").delete(parsed.data.id);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "deleteTransaction",
      userId: user.id,
      transactionId: parsed.data.id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to delete transaction."),
    };
  }
}

const undoSchema = z.object({
  id: z.string().min(1),
  ...baseFields,
});

export type UndoDeleteInput = CreateTransactionInput & { id: string };

/**
 * Re-creates a just-deleted transaction with its original id, so the Undo
 * toast restores the exact row. PB allows client-supplied ids on create as
 * long as they match the collection's autogenerate pattern.
 */
export async function undoDeleteTransaction(
  input: UndoDeleteInput,
): Promise<ActionResult<Transaction>> {
  const parsed = undoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Cannot restore: original data missing." };
  }

  const { pb, user } = await requireAuthenticatedPb();
  const { id, ...rest } = parsed.data;

  try {
    const created = await pb
      .collection("transactions")
      .create({ id, ...buildPayload(rest as ValidatedFields, user.id) });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true, data: toTransaction(created) };
  } catch (err) {
    logError(err, {
      action: "undoDeleteTransaction",
      userId: user.id,
      transactionId: id,
    });
    return {
      ok: false,
      error: pbErrorMessage(err, "Failed to restore transaction."),
    };
  }
}
