import { notFound } from "next/navigation";

import { ReceiptFailedCard } from "@/components/feature/receipt-failed-card";
import { ReceiptReviewForm } from "@/components/feature/receipt-review-form";
import { parseReceiptIfNeeded } from "@/lib/receipts/parse";

export async function ReceiptDetailContent({
  receiptId,
}: {
  receiptId: string;
}) {
  const receipt = await parseReceiptIfNeeded(receiptId);
  if (!receipt) notFound();

  if (receipt.status === "failed") {
    return (
      <ReceiptFailedCard
        receiptId={receipt.id}
        failureReason={receipt.failureReason}
      />
    );
  }

  return <ReceiptReviewForm receipt={receipt} />;
}
