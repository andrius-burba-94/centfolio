import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/categories/types";
import { formatMoney } from "@/lib/money/format";
import type { Tag } from "@/lib/tags/types";
import {
  categoryRowLabel,
  formatTransactionDate,
} from "@/lib/transactions/display";
import type { Transaction } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

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
                <TableRow
                  key={tx.id}
                  className="border-border"
                  data-testid={`transaction-row-${tx.id}`}
                >
                  <TableCell className="px-6 py-4 text-body text-muted-foreground">
                    {formatTransactionDate(tx.date)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-body text-foreground">
                    {tx.merchantName}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-body text-muted-foreground">
                    {tx.description || ""}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-body text-muted-foreground">
                    {categoryRowLabel(tx.categoryId, categoriesById)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <TagChips ids={tx.tagIds} tagsById={tagsById} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-6 py-4 text-right text-body tabular-nums",
                      tx.amount < 0 ? "text-destructive" : "text-positive",
                    )}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatMoney(tx.amount)}
                  </TableCell>
                </TableRow>
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

function TagChips({
  ids,
  tagsById,
}: {
  ids: string[];
  tagsById: Map<string, Tag>;
}) {
  if (ids.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const tag = tagsById.get(id);
        if (!tag) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {tag.name}
          </span>
        );
      })}
    </span>
  );
}
