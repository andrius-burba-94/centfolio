import { describe, expect, it } from "vitest";

import {
  lineItemSchema,
  parsedReceiptSchema,
} from "./schema";

describe("lineItemSchema", () => {
  it("accepts a minimal product line and applies defaults", () => {
    const parsed = lineItemSchema.parse({
      name: "Pienas 1L",
      lineTotalCents: 129,
    });
    expect(parsed).toEqual({
      name: "Pienas 1L",
      quantity: 1,
      unit: null,
      unitPriceCents: null,
      lineTotalCents: 129,
    });
  });

  it("accepts a weighed product line with decimal quantity and unit", () => {
    const parsed = lineItemSchema.parse({
      name: "Bananai",
      quantity: 0.342,
      unit: "kg",
      unitPriceCents: 250,
      lineTotalCents: 86,
    });
    expect(parsed.quantity).toBe(0.342);
    expect(parsed.unit).toBe("kg");
  });

  it("accepts a discount line with a negative line total", () => {
    const parsed = lineItemSchema.parse({
      name: "ACIU nuolaida prekei",
      lineTotalCents: -80,
    });
    expect(parsed.lineTotalCents).toBe(-80);
  });

  it("accepts a split-tender line with a negative line total", () => {
    const parsed = lineItemSchema.parse({
      name: "Atsiskaityta MAXIMOS pinigais",
      lineTotalCents: -17,
    });
    expect(parsed.lineTotalCents).toBe(-17);
  });

  it("rejects an empty name", () => {
    const result = lineItemSchema.safeParse({
      name: "",
      lineTotalCents: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer line total", () => {
    const result = lineItemSchema.safeParse({
      name: "Pienas",
      lineTotalCents: 1.29,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative quantity", () => {
    const zero = lineItemSchema.safeParse({
      name: "Pienas",
      quantity: 0,
      lineTotalCents: 129,
    });
    expect(zero.success).toBe(false);

    const negative = lineItemSchema.safeParse({
      name: "Pienas",
      quantity: -1,
      lineTotalCents: 129,
    });
    expect(negative.success).toBe(false);
  });
});

describe("parsedReceiptSchema", () => {
  const validReceipt = {
    merchant: "Maxima",
    date: "2026-05-31",
    totalCents: 2008,
    lineItems: [
      { name: "Pienas 1L", lineTotalCents: 129 },
      { name: "Duona", lineTotalCents: 250 },
      { name: "ACIU nuolaida prekei", lineTotalCents: -80 },
    ],
  };

  it("accepts a typical receipt with mixed product and discount lines", () => {
    const parsed = parsedReceiptSchema.parse(validReceipt);
    expect(parsed.merchant).toBe("Maxima");
    expect(parsed.totalCents).toBe(2008);
    expect(parsed.lineItems).toHaveLength(3);
  });

  it("does not enforce a sum-equals-total invariant", () => {
    // Sum of line items: 129 + 250 - 80 = 299. Receipt totalCents: 2008.
    // The schema permits this discrepancy by design.
    const sumOfLineTotals = validReceipt.lineItems.reduce(
      (acc, item) => acc + item.lineTotalCents,
      0,
    );
    expect(sumOfLineTotals).not.toBe(validReceipt.totalCents);
    const result = parsedReceiptSchema.safeParse(validReceipt);
    expect(result.success).toBe(true);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    const result = parsedReceiptSchema.safeParse({
      ...validReceipt,
      date: "31/05/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty merchant", () => {
    const result = parsedReceiptSchema.safeParse({
      ...validReceipt,
      merchant: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer totalCents", () => {
    const result = parsedReceiptSchema.safeParse({
      ...validReceipt,
      totalCents: 20.08,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty line items array", () => {
    const result = parsedReceiptSchema.safeParse({
      ...validReceipt,
      lineItems: [],
    });
    expect(result.success).toBe(false);
  });
});
