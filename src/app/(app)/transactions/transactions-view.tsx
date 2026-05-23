"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import {
  deleteTransaction,
  undoDeleteTransaction,
} from "@/lib/transactions/actions";
import type { DateRangeName } from "@/lib/transactions/date-range";
import type { Transaction } from "@/lib/transactions/types";

import { TransactionFilters } from "./transaction-filters";
import { TransactionRow } from "./transaction-row";

type Props = {
  transactions: Transaction[];
  totalItems: number;
  categories: Category[];
  tags: Tag[];
  filtersActive: boolean;
  filterInitial: {
    q: string;
    range: DateRangeName;
    from?: string;
    to?: string;
    categoryId: string | null;
    tagIds: string[];
  };
};

const UNDO_WINDOW_MS = 5000;

export function TransactionsView({
  transactions,
  totalItems,
  categories,
  tags,
  filtersActive,
  filterInitial,
}: Props) {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  );
  const [, startTransition] = useTransition();

  function markPending(id: string) {
    setPendingDeleteIds((s) => {
      const next = new Set(s);
      next.add(id);
      return next;
    });
  }

  function clearPending(id: string) {
    setPendingDeleteIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  function handleDelete(tx: Transaction) {
    markPending(tx.id);
    startTransition(async () => {
      const result = await deleteTransaction({ id: tx.id });
      if (!result.ok) {
        clearPending(tx.id);
        toast.error(result.error);
        return;
      }
      toast("Transaction deleted.", {
        action: {
          label: "Undo",
          onClick: () => {
            startTransition(async () => {
              const undo = await undoDeleteTransaction({
                id: tx.id,
                merchantName: tx.merchantName,
                amount: tx.amount,
                date: tx.date,
                description: tx.description,
                notes: tx.notes,
                categoryId: tx.categoryId,
                tagIds: tx.tagIds,
              });
              if (undo.ok) {
                clearPending(tx.id);
                toast.success("Transaction restored.");
              } else {
                toast.error(undo.error);
              }
            });
          },
        },
        duration: UNDO_WINDOW_MS,
      });
    });
  }

  const visible = transactions.filter((t) => !pendingDeleteIds.has(t.id));

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
          <p
            className="mt-1 text-label text-muted-foreground"
            data-testid="page-meta"
          >
            {totalItems === 0
              ? "No transactions yet."
              : `${totalItems} transaction${totalItems === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Button asChild data-testid="add-transaction-button">
          <Link href="/transactions?new=true">Add transaction</Link>
        </Button>
      </div>

      <TransactionFilters
        initial={filterInitial}
        categories={categories}
        tags={tags}
      />

      {visible.length === 0 ? (
        <EmptyState filtersActive={filtersActive} />
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
                <TableHead className="w-12 px-6 py-4" aria-label="Row actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categoriesById={categoriesById}
                  tagsById={tagsById}
                  onDelete={() => handleDelete(tx)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function EmptyState({ filtersActive }: { filtersActive: boolean }) {
  if (filtersActive) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md bg-card p-12 text-center"
        data-testid="transactions-empty-state-filtered"
      >
        <p className="font-display text-headline text-foreground">
          No transactions match.
        </p>
        <p className="max-w-[42ch] text-body text-muted-foreground">
          Clear filters to see the full list.
        </p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/transactions">Clear filters</Link>
        </Button>
      </div>
    );
  }
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
