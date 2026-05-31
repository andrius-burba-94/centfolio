import { z } from "zod";

/**
 * The shape Gemini returns and Zod validates. The single source of truth
 * per ADR-0003; the response_schema sent to Gemini is derived from this,
 * not hand-written alongside it.
 *
 * Line totals may be negative for discount or split-tender lines. The
 * sum of line totals is not guaranteed to equal `totalCents`; see
 * `.claude/rules/receipts.md` for why.
 */
export const lineItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().positive().default(1),
  unit: z.string().trim().min(1).max(20).nullable().default(null),
  unitPriceCents: z.number().int().nullable().default(null),
  lineTotalCents: z.number().int(),
});

export const parsedReceiptSchema = z.object({
  merchant: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  totalCents: z.number().int(),
  lineItems: z.array(lineItemSchema).min(1),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type ParsedReceipt = z.infer<typeof parsedReceiptSchema>;
