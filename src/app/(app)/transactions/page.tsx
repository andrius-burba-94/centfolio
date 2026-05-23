import { TransactionSheet } from "@/components/feature/transaction-sheet";
import { listCategories } from "@/lib/categories/queries";
import { listTags } from "@/lib/tags/queries";
import { listTransactions } from "@/lib/transactions/queries";
import type { Transaction } from "@/lib/transactions/types";

import { TransactionsView } from "./transactions-view";

export const dynamic = "force-dynamic";

type SearchParams = {
  new?: string;
  edit?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [transactionResult, categories, tags] = await Promise.all([
    listTransactions(),
    listCategories(),
    listTags(),
  ]);

  const editing: Transaction | null = params.edit
    ? (transactionResult.items.find((t) => t.id === params.edit) ?? null)
    : null;

  const sheetMode = params.new === "true" ? "new" : editing ? "edit" : null;

  return (
    <>
      <TransactionsView
        transactions={transactionResult.items}
        totalItems={transactionResult.totalItems}
        categories={categories}
        tags={tags}
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
