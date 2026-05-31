"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money/format";
import {
  confirmReceipt,
  deleteReceipt,
  retryParse,
} from "@/lib/receipts/actions";
import type {
  LineItemRecord,
  ReceiptWithLineItems,
} from "@/lib/receipts/types";
import { cn } from "@/lib/utils";

type Props = {
  receipt: ReceiptWithLineItems;
};

type EditableLineItem = {
  id?: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitPriceCents: number | null;
  lineTotalCents: number;
  position: number;
};

function toEditable(li: LineItemRecord): EditableLineItem {
  return {
    id: li.id,
    name: li.name,
    quantity: li.quantity,
    unit: li.unit,
    unitPriceCents: li.unitPriceCents,
    lineTotalCents: li.lineTotalCents,
    position: li.position,
  };
}

function formatQty(item: EditableLineItem): string {
  if (item.unit) {
    const qtyStr = item.quantity.toLocaleString("lt-LT", {
      maximumFractionDigits: 3,
    });
    return `${qtyStr} ${item.unit}`;
  }
  if (item.quantity === 1) return "";
  return String(item.quantity);
}

export function ReceiptReviewForm({ receipt }: Props) {
  const router = useRouter();
  const readOnly = receipt.status === "confirmed" ||
    receipt.status === "matched";

  const [merchant, setMerchant] = useState(receipt.merchant);
  const [date, setDate] = useState(receipt.date);
  const [items, setItems] = useState<EditableLineItem[]>(
    receipt.lineItems.map(toEditable),
  );
  const [isPending, startTransition] = useTransition();

  function updateItem(index: number, patch: Partial<EditableLineItem>) {
    setItems((s) => s.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function addItem() {
    setItems((s) => [
      ...s,
      {
        name: "",
        quantity: 1,
        unit: null,
        unitPriceCents: null,
        lineTotalCents: 0,
        position: s.length,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((s) => s.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (!merchant.trim()) {
      toast.error("Merchant is required.");
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast.error("Date must be YYYY-MM-DD.");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }

    startTransition(async () => {
      const result = await confirmReceipt({
        id: receipt.id,
        merchant: merchant.trim(),
        date,
        totalCents: receipt.totalCents ?? 0,
        lineItems: items.map((item, position) => ({
          id: item.id,
          name: item.name.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          position,
        })),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Receipt confirmed.");
      router.refresh();
    });
  }

  function handleReparse() {
    startTransition(async () => {
      const result = await retryParse({ id: receipt.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReceipt({ id: receipt.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push("/receipts");
    });
  }

  return (
    <div
      className="rounded-md bg-card p-6"
      data-testid="receipt-review-form"
    >
      <input
        type="text"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        disabled={readOnly}
        data-testid="receipt-merchant-input"
        placeholder="Merchant"
        className="mb-1 -ml-2 w-full rounded-sm border border-transparent bg-transparent px-2 py-1 font-display text-headline text-foreground outline-none focus:border-input focus:bg-background focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mb-5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={readOnly}
          data-testid="receipt-date-input"
          className="-ml-2 rounded-sm border border-transparent bg-transparent px-2 py-1 text-label text-muted-foreground outline-none focus:border-input focus:bg-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col" data-testid="receipt-line-items">
        {items.map((item, index) => (
          <LineItemRow
            key={item.id ?? `new-${index}`}
            item={item}
            index={index}
            readOnly={readOnly}
            onNameChange={(name) => updateItem(index, { name })}
            onRemove={() => removeItem(index)}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="mt-3">
          <Button
            variant="ghost"
            onClick={addItem}
            data-testid="receipt-add-line-item"
          >
            + Add line
          </Button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_96px] items-baseline gap-4 border-t border-border pt-4">
        <span className="text-label font-medium tracking-tight text-muted-foreground">
          Receipt total
        </span>
        <span />
        <span
          className="text-right font-display text-title tabular-nums text-foreground"
          data-testid="receipt-total"
        >
          {receipt.totalCents !== null
            ? formatMoney(receipt.totalCents)
            : "·"}
        </span>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              onClick={handleReparse}
              disabled={isPending}
              data-testid="receipt-reparse-button"
            >
              Reparse
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isPending}
              data-testid="receipt-confirm-button"
            >
              {isPending ? "Saving…" : "Confirm"}
            </Button>
          </>
        )}
        {readOnly && (
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            data-testid="receipt-delete-button"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

type RowProps = {
  item: EditableLineItem;
  index: number;
  readOnly: boolean;
  onNameChange: (name: string) => void;
  onRemove: () => void;
};

function LineItemRow({
  item,
  index,
  readOnly,
  onNameChange,
  onRemove,
}: RowProps) {
  const isSubordinate = item.lineTotalCents < 0;

  return (
    <div
      className={cn(
        "group grid grid-cols-[minmax(0,1fr)_auto_96px_auto] items-baseline gap-4 py-2",
      )}
      data-testid={`receipt-line-item-${index}`}
    >
      <input
        type="text"
        value={item.name}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={readOnly}
        data-testid={`receipt-line-item-name-${index}`}
        className={cn(
          "min-w-0 -ml-2 truncate rounded-sm border border-transparent bg-transparent px-2 py-0.5 text-body text-foreground outline-none focus:border-input focus:bg-background focus-visible:ring-2 focus-visible:ring-ring",
          isSubordinate && "text-label text-muted-foreground",
        )}
      />
      <span
        className={cn(
          "whitespace-nowrap text-right text-label tabular-nums text-foreground",
          isSubordinate && "text-muted-foreground",
        )}
      >
        {formatQty(item)}
      </span>
      <span
        className={cn(
          "text-right tabular-nums text-body text-foreground",
          item.lineTotalCents < 0 && "text-destructive",
          isSubordinate && "text-label",
        )}
      >
        {formatMoney(item.lineTotalCents)}
      </span>
      {!readOnly
        ? (
          <button
            type="button"
            onClick={onRemove}
            data-testid={`receipt-line-item-remove-${index}`}
            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Remove line item"
          >
            ×
          </button>
        )
        : <span />}
    </div>
  );
}
