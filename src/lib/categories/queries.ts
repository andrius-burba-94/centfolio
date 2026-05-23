import "server-only";
import type { RecordModel } from "pocketbase";

import { requireAuthenticatedPb } from "@/lib/auth/session";

import type { Category } from "./types";

export { withDisplayNames, groupByParent } from "./transform";

function toCategory(r: RecordModel): Category {
  return {
    id: String(r.id),
    name: String(r.name),
    parentId: r.parentId ? String(r.parentId) : null,
    userId: String(r.userId),
    created: String(r.created),
    updated: String(r.updated),
  };
}

export async function listCategories(): Promise<Category[]> {
  const { pb, user } = await requireAuthenticatedPb();
  const records = await pb.collection("categories").getFullList({
    filter: `userId = '${user.id}'`,
    sort: "name",
  });
  return records.map(toCategory);
}
