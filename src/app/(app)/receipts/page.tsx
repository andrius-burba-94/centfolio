import { listReceipts } from "@/lib/receipts/queries";

import { ReceiptsView } from "./receipts-view";

export const dynamic = "force-dynamic";

type SearchParams = {
  new?: string;
};

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const receipts = await listReceipts();
  return (
    <ReceiptsView
      receipts={receipts}
      newOpen={params.new === "true"}
    />
  );
}
