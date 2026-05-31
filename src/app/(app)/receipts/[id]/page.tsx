import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReceiptParsingSkeleton } from "@/components/feature/receipt-parsing-skeleton";
import { getReceipt } from "@/lib/receipts/queries";
import { sourceFullLabel, statusLabel } from "@/lib/receipts/display";
import { cn } from "@/lib/utils";

import { ReceiptDetailContent } from "./receipt-detail-content";

export const dynamic = "force-dynamic";

type Params = { id: string };

function statusBadgeClass(status: string) {
  switch (status) {
    case "parsing":
    case "parsed":
      return "bg-muted text-foreground";
    case "confirmed":
    case "matched":
      return "bg-card text-positive";
    case "failed":
      return "bg-card text-destructive";
    default:
      return "bg-muted text-foreground";
  }
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) notFound();

  return (
    <section className="px-8 pt-6 pb-12" data-testid="receipt-detail">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/receipts"
            className="mb-2 inline-block text-label text-muted-foreground hover:text-foreground"
            data-testid="receipt-back-link"
          >
            ← Back to receipts
          </Link>
          <h1 className="font-display text-headline text-foreground">
            Receipt
          </h1>
          <p className="mt-1 text-label text-muted-foreground">
            <span
              className={cn(
                "mr-3 inline-block rounded-sm px-2 py-0.5 text-xs font-medium tracking-tight",
                statusBadgeClass(receipt.status),
              )}
              data-testid="receipt-detail-status"
            >
              {statusLabel(receipt.status)}
            </span>
            {sourceFullLabel(receipt.sourceType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <aside className="rounded-md bg-card p-4 lg:sticky lg:top-6 lg:self-start">
          {receipt.sourceType === "photo"
            ? (
              <>
                <Label>Photo</Label>
                {receipt.photo
                  ? (
                    // The photo is already server-side normalized to
                    // <= 1600px JPEG by sharp before storage, so
                    // next/image would add little value here and would
                    // require configuring remotePatterns for the PB
                    // host. Plain <img> is the right call for Phase 3.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl(receipt.id, receipt.photo)}
                      alt="Receipt"
                      className="mt-3 max-h-[640px] w-full rounded-sm border border-border bg-background object-contain"
                      data-testid="receipt-photo"
                    />
                  )
                  : (
                    <p className="mt-3 text-label text-placeholder">
                      No photo on row.
                    </p>
                  )}
              </>
            )
            : (
              <>
                <Label>Source text</Label>
                <pre
                  className="mt-3 max-h-[480px] overflow-y-auto rounded-sm border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground"
                  data-testid="receipt-source-text"
                >
                  {receipt.sourceText || (
                    <span className="text-placeholder">
                      No source text on row.
                    </span>
                  )}
                </pre>
              </>
            )}
        </aside>

        <div>
          <Suspense fallback={<ReceiptParsingSkeleton />}>
            <ReceiptDetailContent receiptId={id} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-label tracking-tight text-muted-foreground">
      {children}
    </span>
  );
}

function photoUrl(receiptId: string, filename: string): string {
  const base = process.env.NEXT_PUBLIC_POCKETBASE_URL ??
    process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
  return `${base}/api/files/receipts/${receiptId}/${filename}`;
}
