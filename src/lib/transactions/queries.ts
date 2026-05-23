import "server-only";

import { requireAuthenticatedPb } from "@/lib/auth/session";

import { toTransaction } from "./record";
import {
  TRANSACTIONS_PER_PAGE,
  type Transaction,
  type TransactionFilters,
  type TransactionListResult,
} from "./types";

function escapeFilterValue(v: string): string {
  return v.replace(/'/g, "\\'");
}

function buildFilter(userId: string, filters: TransactionFilters): string {
  const parts: string[] = [`userId = '${userId}'`];

  if (filters.q?.trim()) {
    const q = escapeFilterValue(filters.q.trim());
    parts.push(
      `(merchantName ~ '${q}' || description ~ '${q}' || notes ~ '${q}')`,
    );
  }

  if (filters.from) {
    parts.push(`date >= '${escapeFilterValue(filters.from)}'`);
  }
  if (filters.to) {
    parts.push(`date <= '${escapeFilterValue(filters.to)}'`);
  }

  if (filters.categoryId) {
    parts.push(`categoryId = '${escapeFilterValue(filters.categoryId)}'`);
  }

  if (filters.tagIds?.length) {
    for (const id of filters.tagIds) {
      parts.push(`tagIds ?= '${escapeFilterValue(id)}'`);
    }
  }

  return parts.join(" && ");
}

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionListResult> {
  const { pb, user } = await requireAuthenticatedPb();
  const page = filters.page ?? 1;
  const result = await pb
    .collection("transactions")
    .getList(page, TRANSACTIONS_PER_PAGE, {
      filter: buildFilter(user.id, filters),
      sort: "-date,-created",
    });

  return {
    items: result.items.map(toTransaction),
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { pb, user } = await requireAuthenticatedPb();
  try {
    const record = await pb.collection("transactions").getOne(id);
    if (String(record.userId) !== user.id) return null;
    return toTransaction(record);
  } catch {
    return null;
  }
}

export async function listMerchants(): Promise<string[]> {
  const { pb, user } = await requireAuthenticatedPb();
  const records = await pb.collection("transactions").getFullList({
    filter: `userId = '${user.id}'`,
    fields: "merchantName,created",
    sort: "-created",
  });
  const seen = new Set<string>();
  const merchants: string[] = [];
  for (const r of records) {
    const name = String(r.merchantName);
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merchants.push(name);
    }
  }
  return merchants;
}
