import "server-only";
import type { RecordModel } from "pocketbase";

import type {
  LineItemRecord,
  Receipt,
  ReceiptSourceType,
  ReceiptStatus,
} from "./types";

export function toReceipt(r: RecordModel): Receipt {
  return {
    id: String(r.id),
    userId: String(r.userId),
    status: String(r.status) as ReceiptStatus,
    sourceType: String(r.sourceType) as ReceiptSourceType,
    sourceText: r.sourceText ? String(r.sourceText) : "",
    photo: r.photo ? String(r.photo) : "",
    merchant: r.merchant ? String(r.merchant) : "",
    // PB stores date fields as full datetimes ("YYYY-MM-DD HH:MM:SS.sssZ").
    // Normalize to YYYY-MM-DD so <input type="date"> and the Zod regex on
    // confirmReceipt accept the value without further parsing.
    date: r.date ? String(r.date).slice(0, 10) : "",
    totalCents: r.totalCents === null || r.totalCents === undefined
      ? null
      : Number(r.totalCents),
    parseAttempts: Number(r.parseAttempts ?? 0),
    failureReason: r.failureReason ? String(r.failureReason) : "",
    created: String(r.created),
    updated: String(r.updated),
  };
}

export function toLineItem(r: RecordModel): LineItemRecord {
  return {
    id: String(r.id),
    userId: String(r.userId),
    receiptId: String(r.receiptId),
    name: String(r.name),
    quantity: Number(r.quantity),
    unit: r.unit ? String(r.unit) : null,
    unitPriceCents: r.unitPriceCents === null ||
      r.unitPriceCents === undefined
      ? null
      : Number(r.unitPriceCents),
    lineTotalCents: Number(r.lineTotalCents),
    position: Number(r.position ?? 0),
    created: String(r.created),
    updated: String(r.updated),
  };
}
