"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteReceipt, retryParse } from "@/lib/receipts/actions";

type Props = {
  receiptId: string;
  failureReason: string;
};

export function ReceiptFailedCard({ receiptId, failureReason }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    startTransition(async () => {
      const result = await retryParse({ id: receiptId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReceipt({ id: receiptId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push("/receipts");
    });
  }

  return (
    <div
      className="rounded-md bg-card px-6 py-8 text-center"
      data-testid="receipt-failed-card"
    >
      <p className="mb-2 text-2xl text-destructive leading-none">!</p>
      <p className="mb-2 font-display text-title text-foreground">
        Couldn&rsquo;t parse this receipt.
      </p>
      <p className="mx-auto mb-6 max-w-prose text-body text-muted-foreground">
        Try again, or delete it and start over.
        {failureReason
          ? (
            <span className="mt-2 block text-label text-placeholder">
              ({failureReason})
            </span>
          )
          : null}
      </p>
      <div className="flex justify-center gap-2">
        <Button
          onClick={handleRetry}
          disabled={isPending}
          data-testid="receipt-retry-button"
        >
          {isPending ? "…" : "Try again"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isPending}
          data-testid="receipt-delete-button"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
