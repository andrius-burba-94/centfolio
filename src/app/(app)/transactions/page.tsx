import { TransactionSheet } from "@/components/feature/transaction-sheet";
import { listCategories } from "@/lib/categories/queries";
import { listTags } from "@/lib/tags/queries";
import { resolveRange } from "@/lib/transactions/date-range";
import { listTransactions } from "@/lib/transactions/queries";
import type { Transaction } from "@/lib/transactions/types";

import { TransactionsView } from "./transactions-view";

export const dynamic = "force-dynamic";

type SearchParams = {
  new?: string;
  edit?: string;
  q?: string;
  range?: string;
  from?: string;
  to?: string;
  category?: string;
  tags?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = resolveRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });
  const tagIds = params.tags?.split(",").filter(Boolean) ?? [];

  const filters = {
    q: params.q?.trim() || undefined,
    from: range.from,
    to: range.to,
    categoryId: params.category || undefined,
    tagIds,
  };

  const [transactionResult, categories, tags] = await Promise.all([
    listTransactions(filters),
    listCategories(),
    listTags(),
  ]);

  const editing: Transaction | null = params.edit
    ? (transactionResult.items.find((t) => t.id === params.edit) ?? null)
    : null;

  const sheetMode = params.new === "true" ? "new" : editing ? "edit" : null;
  const filtersAreActive =
    Boolean(params.q) ||
    range.name !== "this-month" ||
    Boolean(params.category) ||
    tagIds.length > 0;

  return (
    <>
      <TransactionsView
        transactions={transactionResult.items}
        totalItems={transactionResult.totalItems}
        categories={categories}
        tags={tags}
        filtersActive={filtersAreActive}
        filterInitial={{
          q: params.q ?? "",
          range: range.name,
          from: range.from,
          to: range.to,
          categoryId: params.category ?? null,
          tagIds,
        }}
      />
      <TransactionSheet
        mode={sheetMode}
        transaction={editing}
        categories={categories}
        tags={tags}
      />
    </>
  );
}
