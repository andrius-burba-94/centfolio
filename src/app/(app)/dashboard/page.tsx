import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { rangeBounds } from "@/lib/transactions/date-range";
import { listTransactions } from "@/lib/transactions/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { from, to } = rangeBounds("this-month");
  const { totalItems } = await listTransactions({ from, to });

  if (totalItems === 0) {
    return (
      <section
        className="flex flex-1 flex-col items-center justify-center px-6"
        data-testid="dashboard-empty-state"
      >
        <div className="text-center">
          <h1 className="font-display text-display text-foreground">
            Your money, considered.
          </h1>
          <p className="mt-4 mx-auto max-w-[42ch] text-body text-muted-foreground">
            Centfolio is empty until you connect an account. Account-connection
            arrives in a later phase. Settle in.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col px-8 py-8">
      <Card className="max-w-md" data-testid="dashboard-this-month-card">
        <CardHeader>
          <CardTitle>This month</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p
            className="font-display text-display tabular-nums text-foreground"
            data-testid="dashboard-this-month-count"
          >
            {totalItems}
          </p>
          <p className="text-body text-muted-foreground">
            {totalItems === 1
              ? "transaction recorded"
              : "transactions recorded"}
          </p>
          <Link
            href="/transactions"
            className="mt-2 text-label text-muted-foreground hover:text-foreground"
            data-testid="dashboard-view-all-link"
          >
            View all →
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
