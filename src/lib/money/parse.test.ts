import { describe, it, expect } from "vitest";

import { parseMoney } from "./parse";

describe("parseMoney", () => {
  describe("basic decimals", () => {
    it("parses 34,27 as 3427 cents", () => {
      expect(parseMoney("34,27")).toBe(3427);
    });

    it("parses 34.27 as 3427 cents (US format also accepted)", () => {
      expect(parseMoney("34.27")).toBe(3427);
    });

    it("parses 0,00 as 0", () => {
      expect(parseMoney("0,00")).toBe(0);
    });

    it("parses 0 as 0", () => {
      expect(parseMoney("0")).toBe(0);
    });

    it("parses whole euros without decimals", () => {
      expect(parseMoney("1234")).toBe(123400);
    });
  });

  describe("fractional with one digit", () => {
    it("treats single-digit fractional as 0.X0", () => {
      expect(parseMoney("1,5")).toBe(150);
    });

    it("handles 0,5 as 50 cents", () => {
      expect(parseMoney("0,5")).toBe(50);
    });

    it("handles .5 as 50 cents", () => {
      expect(parseMoney(".5")).toBe(50);
    });
  });

  describe("thousands separators", () => {
    it("parses 1.250,00 (Lithuanian) as 125000", () => {
      expect(parseMoney("1.250,00")).toBe(125000);
    });

    it("parses 1,250.00 (US) as 125000", () => {
      expect(parseMoney("1,250.00")).toBe(125000);
    });

    it("treats 3+ trailing digits as thousands group", () => {
      expect(parseMoney("1,250")).toBe(125000);
    });

    it("parses million-level values", () => {
      expect(parseMoney("1.234.567,89")).toBe(123456789);
    });

    it("accepts space as thousands separator", () => {
      expect(parseMoney("1 250,00")).toBe(125000);
    });
  });

  describe("currency symbol", () => {
    it("strips leading symbol with NBSP", () => {
      expect(parseMoney("€ 34,27")).toBe(3427);
    });

    it("strips trailing symbol with NBSP", () => {
      expect(parseMoney(`34,27 €`)).toBe(3427);
    });

    it("strips symbol with no space", () => {
      expect(parseMoney("€34,27")).toBe(3427);
    });

    it("strips USD symbol", () => {
      expect(parseMoney("$ 34.27")).toBe(3427);
    });
  });

  describe("signs", () => {
    it("parses negative", () => {
      expect(parseMoney("-34,27")).toBe(-3427);
    });

    it("parses negative with currency", () => {
      expect(parseMoney("-1.250,00 €")).toBe(-125000);
    });

    it("ignores leading plus", () => {
      expect(parseMoney("+34,27")).toBe(3427);
    });
  });

  describe("whitespace", () => {
    it("trims leading and trailing whitespace", () => {
      expect(parseMoney("   34,27  ")).toBe(3427);
    });
  });

  describe("invalid input", () => {
    it("returns null on empty string", () => {
      expect(parseMoney("")).toBeNull();
    });

    it("returns null on whitespace-only", () => {
      expect(parseMoney("   ")).toBeNull();
    });

    it("returns null on non-numeric", () => {
      expect(parseMoney("abc")).toBeNull();
    });

    it("returns null on partial garbage", () => {
      expect(parseMoney("34,2a")).toBeNull();
    });

    it("returns null on bare sign", () => {
      expect(parseMoney("-")).toBeNull();
    });
  });
});
