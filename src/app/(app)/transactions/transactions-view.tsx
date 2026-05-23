import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/categories/types";
import type { Tag } from "@/lib/tags/types";
import type { Transaction } from "@/lib/transactions/types";

import { TransactionRow } from "./transaction-row";

type Props = {
  transactions: Transaction[];
  totalItems: number;
  categories: Category[];
  tags: Tag[];
};

export function TransactionsView({
  transactions,
  totalItems,
  categories,
  tags,
}: Props) {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  return (
    <section className="flex flex-1 flex-col gap-8 px-8 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1
            className="font-display text-headline text-foreground"
            data-testid="page-title"
          >
            Transactions
          </h1>
          <p className="mt-1 text-label text-muted-foreground" data-testid="page-meta">
            {totalItems === 0
              ? "No transactions yet."
              : `${totalItems} transaction${totalItems === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Button asChild data-testid="add-transaction-button">
          <Link href="/transactions?new=true">Add transaction</Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="rounded-md bg-card"
          data-testid="transactions-table-card"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="px-6 py-4 text-label text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="px-6 py-4 text-label text-muted-foreground">
                  Merchant
                </TableHead>
                <TableHead className="px-6 py-4 text-label text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="px-6 py-4 text-label text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="px-6 py-4 text-label text-muted-foreground">
                  Tags
                </TableHead>
                <TableHead className="px-6 py-4 text-right text-label text-muted-foreground">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categoriesById={categoriesById}
                  tagsById={tagsById}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md bg-card p-12 text-center"
      data-testid="transactions-empty-state"
    >
      <p className="font-display text-headline text-foreground">
        No transactions yet.
      </p>
      <p className="max-w-[42ch] text-body text-muted-foreground">
        Record a cash or card purchase, classify it, and find it again later.
      </p>
      <Button asChild className="mt-4">
        <Link href="/transactions?new=true">Add your first transaction</Link>
      </Button>
    </div>
  );
}

