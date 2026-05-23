import { describe, it, expect } from "vitest";

import { sumMoney } from "./sum";

describe("sumMoney", () => {
  it("sums an empty array to zero", () => {
    expect(sumMoney([])).toBe(0);
  });

  it("returns single value unchanged", () => {
    expect(sumMoney([3427])).toBe(3427);
  });

  it("sums multiple positive values", () => {
    expect(sumMoney([100, 200, 300])).toBe(600);
  });

  it("sums mixed signs without floating-point error", () => {
    expect(sumMoney([-100, 200, -50])).toBe(50);
  });

  it("handles large values without precision loss", () => {
    expect(sumMoney([100_000_000, 200_000_000, 50_000_000])).toBe(
      350_000_000,
    );
  });

  it("preserves integer cents (no 0.1 + 0.2 = 0.30000004)", () => {
    expect(sumMoney([10, 20])).toBe(30);
  });
});
