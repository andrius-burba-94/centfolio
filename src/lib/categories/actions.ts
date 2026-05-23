"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedPb } from "@/lib/auth/session";
import { logError } from "@/lib/log/logError";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const nameSchema = z.string().trim().min(1).max(100);

const createSchema = z.object({
  name: nameSchema,
  parentId: z.string().min(1).optional().nullable(),
});

export async function createCategory(input: {
  name: string;
  parentId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Name is required and must be 100 characters or fewer.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();

  if (parsed.data.parentId) {
    try {
      const parent = await pb
        .collection("categories")
        .getOne(parsed.data.parentId);
      if (parent.parentId) {
        return {
          ok: false,
          error: "Categories can only have one level of children.",
        };
      }
    } catch (err) {
      logError(err, {
        action: "createCategory.findParent",
        userId: user.id,
        parentId: parsed.data.parentId,
      });
      return { ok: false, error: "Parent category not found." };
    }
  }

  const payload: Record<string, unknown> = {
    name: parsed.data.name,
    userId: user.id,
  };
  if (parsed.data.parentId) {
    payload.parentId = parsed.data.parentId;
  }

  try {
    const created = await pb.collection("categories").create(payload);
    revalidatePath("/transactions/categories");
    return { ok: true, data: { id: String(created.id) } };
  } catch (err) {
    logError(err, { action: "createCategory", userId: user.id });
    return { ok: false, error: "Failed to create category." };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
});

export async function updateCategory(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Name is required and must be 100 characters or fewer.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();

  try {
    await pb.collection("categories").update(parsed.data.id, {
      name: parsed.data.name,
    });
    revalidatePath("/transactions/categories");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "updateCategory",
      userId: user.id,
      categoryId: parsed.data.id,
    });
    return { ok: false, error: "Failed to update category." };
  }
}

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function deleteCategory(input: {
  id: string;
}): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid category id." };
  }

  const { pb, user } = await requireAuthenticatedPb();

  try {
    const children = await pb.collection("categories").getList(1, 1, {
      filter: `parentId = '${parsed.data.id}' && userId = '${user.id}'`,
    });
    if (children.totalItems > 0) {
      const count = children.totalItems;
      return {
        ok: false,
        error: `Cannot delete: this category has ${count} subcategor${count === 1 ? "y" : "ies"}. Move or delete them first.`,
      };
    }
  } catch (err) {
    logError(err, {
      action: "deleteCategory.checkChildren",
      userId: user.id,
      categoryId: parsed.data.id,
    });
    return { ok: false, error: "Failed to check subcategories." };
  }

  try {
    const txs = await pb.collection("transactions").getList(1, 1, {
      filter: `categoryId = '${parsed.data.id}' && userId = '${user.id}'`,
    });
    if (txs.totalItems > 0) {
      const count = txs.totalItems;
      return {
        ok: false,
        error: `Cannot delete: this category is on ${count} transaction${count === 1 ? "" : "s"}. Re-categorize them first.`,
      };
    }
  } catch (err) {
    logError(err, {
      action: "deleteCategory.checkTransactions",
      userId: user.id,
      categoryId: parsed.data.id,
    });
    return { ok: false, error: "Failed to check transaction usage." };
  }

  try {
    await pb.collection("categories").delete(parsed.data.id);
    revalidatePath("/transactions/categories");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "deleteCategory",
      userId: user.id,
      categoryId: parsed.data.id,
    });
    return { ok: false, error: "Failed to delete category." };
  }
}
