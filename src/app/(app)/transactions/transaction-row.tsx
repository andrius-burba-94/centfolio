"use client";

import { useRouter } from "next/navigation";

import { TableCell, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money/format";
import type { Tag } from "@/lib/tags/types";
import {
  categoryRowLabel,
  formatTransactionDate,
} from "@/lib/transactions/display";
import type { Transaction } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/categories/types";

type Props = {
  transaction: Transaction;
  categoriesById: Map<string, Category>;
  tagsById: Map<string, Tag>;
};

export function TransactionRow({ transaction, categoriesById, tagsById }: Props) {
  const router = useRouter();
  const isSpent = transaction.amount < 0;

  function open() {
    router.push(`/transactions?edit=${transaction.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  return (
    <TableRow
      onClick={open}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Edit transaction ${transaction.merchantName}`}
      className="cursor-pointer border-border outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      data-testid={`transaction-row-${transaction.id}`}
    >
      <TableCell className="px-6 py-4 text-body text-muted-foreground">
        {formatTransactionDate(transaction.date)}
      </TableCell>
      <TableCell className="px-6 py-4 text-body text-foreground">
        {transaction.merchantName}
      </TableCell>
      <TableCell className="px-6 py-4 text-body text-muted-foreground">
        {transaction.description}
      </TableCell>
      <TableCell className="px-6 py-4 text-body text-muted-foreground">
        {categoryRowLabel(transaction.categoryId, categoriesById)}
      </TableCell>
      <TableCell className="px-6 py-4">
        <TagChips ids={transaction.tagIds} tagsById={tagsById} />
      </TableCell>
      <TableCell
        className={cn(
          "px-6 py-4 text-right text-body tabular-nums",
          isSpent ? "text-destructive" : "text-positive",
        )}
      >
        {!isSpent ? "+" : ""}
        {formatMoney(transaction.amount)}
      </TableCell>
    </TableRow>
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
