"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money/format";
import {
  sourceLabel,
  statusLabel,
} from "@/lib/receipts/display";
import type { Receipt } from "@/lib/receipts/types";
import { cn } from "@/lib/utils";

import { ReceiptEntrySheet } from "@/components/feature/receipt-entry-sheet";

type Props = {
  receipts: Receipt[];
  newOpen: boolean;
};

function statusBadgeClass(status: Receipt["status"]) {
  switch (status) {
    case "parsing":
    case "parsed":
      return "bg-muted text-foreground";
    case "confirmed":
    case "matched":
      return "bg-card text-positive";
    case "failed":
      return "bg-card text-destructive";
  }
}

export function ReceiptsView({ receipts, newOpen }: Props) {
  const router = useRouter();

  function openNew() {
    const params = new URLSearchParams(window.location.search);
    params.set("new", "true");
    router.push(`/receipts?${params.toString()}`);
  }

  function closeNew() {
    router.push("/receipts");
  }

  return (
    <section className="px-8 pt-6 pb-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-headline text-foreground">
          Receipts
        </h1>
        {receipts.length > 0 && (
          <Button onClick={openNew} data-testid="add-receipt-button">
            Add receipt
          </Button>
        )}
      </div>

      {receipts.length === 0
        ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-24 text-center"
            data-testid="receipts-empty-state"
          >
            <p className="mb-3 font-display text-headline text-foreground">
              No receipts yet.
            </p>
            <p className="mb-6 max-w-prose text-body text-muted-foreground">
              Paste an emailed receipt to get started.
            </p>
            <Button onClick={openNew} data-testid="add-receipt-empty-button">
              Add receipt
            </Button>
          </div>
        )
        : (
          <Table data-testid="receipts-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  statusBadgeClass={statusBadgeClass(receipt.status)}
                />
              ))}
            </TableBody>
          </Table>
        )}

      <ReceiptEntrySheet open={newOpen} onClose={closeNew} />
    </section>
  );
}

type RowProps = {
  receipt: Receipt;
  statusBadgeClass: string;
};

function ReceiptRow({ receipt, statusBadgeClass }: RowProps) {
  const hasMerchant = receipt.merchant.length > 0;
  const hasTotal = receipt.totalCents !== null;
  return (
    <TableRow
      data-testid={`receipt-row-${receipt.id}`}
      data-status={receipt.status}
    >
      <TableCell>
        <span
          className="text-muted-foreground"
          title={sourceLabel(receipt.sourceType)}
          aria-label={sourceLabel(receipt.sourceType)}
        >
          {receipt.sourceType === "text" ? "✉" : "▢"}
        </span>
      </TableCell>
      <TableCell>
        <Link
          href={`/receipts/${receipt.id}`}
          className="text-foreground hover:underline"
        >
          {hasMerchant
            ? receipt.merchant
            : <span className="text-placeholder">·</span>}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {receipt.date || (
          <span className="text-placeholder">·</span>
        )}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-block rounded-sm px-2 py-0.5 text-xs font-medium tracking-tight",
            statusBadgeClass,
          )}
          data-testid={`receipt-status-${receipt.id}`}
        >
          {statusLabel(receipt.status)}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {hasTotal
          ? formatMoney(receipt.totalCents as number)
          : <span className="text-placeholder">·</span>}
      </TableCell>
    </TableRow>
  );
}
