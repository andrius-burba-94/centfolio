import { Skeleton } from "@/components/ui/skeleton";

export function ReceiptParsingSkeleton() {
  return (
    <div
      className="rounded-md bg-card p-6"
      data-testid="receipt-parsing-skeleton"
    >
      <Skeleton className="mb-2 h-7 w-1/2" />
      <Skeleton className="mb-6 h-4 w-1/4" />
      <div className="flex flex-col gap-2">
        {[70, 55, 78, 60, 64].map((width, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,1fr)_auto_96px] items-baseline gap-4 py-2"
          >
            <Skeleton className="h-4" style={{ width: `${width}%` }} />
            <Skeleton className="h-4 w-12 justify-self-end" />
            <Skeleton className="h-4 w-16 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
