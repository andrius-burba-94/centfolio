import "server-only";

import { requireAuthenticatedPb } from "@/lib/auth/session";

import { toLineItem, toReceipt } from "./record";
import type {
  LineItemRecord,
  Receipt,
  ReceiptWithLineItems,
} from "./types";

export const RECEIPTS_PER_PAGE = 50;

export async function listReceipts(page = 1): Promise<Receipt[]> {
  const { pb, user } = await requireAuthenticatedPb();
  const result = await pb
    .collection("receipts")
    .getList(page, RECEIPTS_PER_PAGE, {
      filter: `userId = '${user.id}'`,
      sort: "-created",
    });
  return result.items.map(toReceipt);
}

export async function getReceipt(
  id: string,
): Promise<ReceiptWithLineItems | null> {
  const { pb, user } = await requireAuthenticatedPb();
  try {
    const record = await pb.collection("receipts").getOne(id);
    if (String(record.userId) !== user.id) return null;
    const receipt = toReceipt(record);

    const lineItems: LineItemRecord[] = receipt.status === "parsing"
      ? []
      : (await pb.collection("lineItems").getFullList({
        filter: `receiptId = '${id}'`,
        sort: "position",
      })).map(toLineItem);

    return { ...receipt, lineItems };
  } catch {
    return null;
  }
}
