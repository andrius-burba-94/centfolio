export type ReceiptStatus =
  | "parsing"
  | "parsed"
  | "confirmed"
  | "matched"
  | "failed";

export type ReceiptSourceType = "photo" | "text";

export type Receipt = {
  id: string;
  userId: string;
  status: ReceiptStatus;
  sourceType: ReceiptSourceType;
  sourceText: string;
  photo: string;
  merchant: string;
  date: string;
  totalCents: number | null;
  parseAttempts: number;
  failureReason: string;
  created: string;
  updated: string;
};

export type LineItemRecord = {
  id: string;
  userId: string;
  receiptId: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitPriceCents: number | null;
  lineTotalCents: number;
  position: number;
  created: string;
  updated: string;
};

export type ReceiptWithLineItems = Receipt & {
  lineItems: LineItemRecord[];
};

export const PARSE_ATTEMPTS_CAP = 3;
