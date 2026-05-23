"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedPb } from "@/lib/auth/session";
import { logError } from "@/lib/log/logError";

import type { ActionResult } from "@/lib/categories/actions";

const nameSchema = z.string().trim().min(1).max(50);

const createSchema = z.object({ name: nameSchema });

export async function createTag(input: {
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Tag name is required and must be 50 characters or fewer.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();

  try {
    const created = await pb.collection("tags").create({
      name: parsed.data.name,
      userId: user.id,
    });
    revalidatePath("/transactions/categories");
    return { ok: true, data: { id: String(created.id) } };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 400) {
      return {
        ok: false,
        error: `Tag "${parsed.data.name}" already exists.`,
      };
    }
    logError(err, { action: "createTag", userId: user.id });
    return { ok: false, error: "Failed to create tag." };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
});

export async function updateTag(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Tag name is required and must be 50 characters or fewer.",
    };
  }

  const { pb, user } = await requireAuthenticatedPb();

  try {
    await pb.collection("tags").update(parsed.data.id, {
      name: parsed.data.name,
    });
    revalidatePath("/transactions/categories");
    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 400) {
      return {
        ok: false,
        error: `Tag "${parsed.data.name}" already exists.`,
      };
    }
    logError(err, {
      action: "updateTag",
      userId: user.id,
      tagId: parsed.data.id,
    });
    return { ok: false, error: "Failed to update tag." };
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteTag(input: { id: string }): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid tag id." };

  const { pb, user } = await requireAuthenticatedPb();

  try {
    await pb.collection("tags").delete(parsed.data.id);
    revalidatePath("/transactions/categories");
    return { ok: true };
  } catch (err) {
    logError(err, {
      action: "deleteTag",
      userId: user.id,
      tagId: parsed.data.id,
    });
    return { ok: false, error: "Failed to delete tag." };
  }
}
