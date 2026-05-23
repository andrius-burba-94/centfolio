import "server-only";
import type { RecordModel } from "pocketbase";

import type { Transaction } from "./types";

export function toTransaction(r: RecordModel): Transaction {
  return {
    id: String(r.id),
    amount: Number(r.amount),
    date: String(r.date),
    merchantName: String(r.merchantName),
    description: r.description ? String(r.description) : "",
    notes: r.notes ? String(r.notes) : "",
    categoryId: r.categoryId ? String(r.categoryId) : null,
    tagIds: Array.isArray(r.tagIds) ? r.tagIds.map(String) : [],
    userId: String(r.userId),
    created: String(r.created),
    updated: String(r.updated),
  };
}
