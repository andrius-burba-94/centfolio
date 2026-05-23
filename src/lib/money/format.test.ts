import { describe, it, expect } from "vitest";

import { formatMoney } from "./format";

const NBSP = " ";

describe("formatMoney", () => {
  describe("whole euros", () => {
    it("formats 1,00", () => {
      expect(formatMoney(100)).toBe(`1,00${NBSP}€`);
    });

    it("formats 0,00", () => {
      expect(formatMoney(0)).toBe(`0,00${NBSP}€`);
    });
  });

  describe("cents", () => {
    it("formats 34,27", () => {
      expect(formatMoney(3427)).toBe(`34,27${NBSP}€`);
    });

    it("pads single-digit fractional", () => {
      expect(formatMoney(105)).toBe(`1,05${NBSP}€`);
    });
  });

  describe("thousands grouping", () => {
    it("uses period as thousands separator", () => {
      expect(formatMoney(125000)).toBe(`1.250,00${NBSP}€`);
    });

    it("groups millions correctly", () => {
      expect(formatMoney(123456789)).toBe(`1.234.567,89${NBSP}€`);
    });

    it("does not group three-digit values", () => {
      expect(formatMoney(99999)).toBe(`999,99${NBSP}€`);
    });
  });

  describe("negative values", () => {
    it("places sign before the amount", () => {
      expect(formatMoney(-3427)).toBe(`-34,27${NBSP}€`);
    });

    it("places sign before grouped thousands", () => {
      expect(formatMoney(-125000)).toBe(`-1.250,00${NBSP}€`);
    });
  });

  describe("options", () => {
    it("withCurrency: false drops symbol and separator", () => {
      expect(formatMoney(3427, { withCurrency: false })).toBe("34,27");
    });

    it("withCurrency: true is the default", () => {
      expect(formatMoney(3427, { withCurrency: true })).toBe(
        `34,27${NBSP}€`,
      );
    });

    it("custom currencySymbol", () => {
      expect(formatMoney(3427, { currencySymbol: "$" })).toBe(
        `34,27${NBSP}$`,
      );
    });
  });
});
