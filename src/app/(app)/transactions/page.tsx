import { listCategories } from "@/lib/categories/queries";
import { listTags } from "@/lib/tags/queries";
import { listTransactions } from "@/lib/transactions/queries";

import { TransactionsView } from "./transactions-view";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [transactionResult, categories, tags] = await Promise.all([
    listTransactions(),
    listCategories(),
    listTags(),
  ]);

  return (
    <TransactionsView
      transactions={transactionResult.items}
      totalItems={transactionResult.totalItems}
      categories={categories}
      tags={tags}
    />
  );
}
