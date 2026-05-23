import "server-only";
import type { RecordModel } from "pocketbase";

import { requireAuthenticatedPb } from "@/lib/auth/session";

import type { Tag } from "./types";

function toTag(r: RecordModel): Tag {
  return {
    id: String(r.id),
    name: String(r.name),
    userId: String(r.userId),
    created: String(r.created),
    updated: String(r.updated),
  };
}

export async function listTags(): Promise<Tag[]> {
  const { pb, user } = await requireAuthenticatedPb();
  const records = await pb.collection("tags").getFullList({
    filter: `userId = '${user.id}'`,
    sort: "name",
  });
  return records.map(toTag);
}
