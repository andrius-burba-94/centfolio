/**
 * Parse a user-entered money string into integer cents.
 *
 * Accepts Lithuanian (1.250,00), US (1,250.00), and bare-integer (1234)
 * formats. Strips currency symbols (€, $, £, ¥), leading/trailing
 * whitespace, and internal NBSP/space thousands separators.
 *
 * Returns null on invalid input. Never throws.
 */
export function parseMoney(input: string): number | null {
  if (typeof input !== "string") return null;

  let s = input
    .trim()
    .replace(/[€$£¥]/g, "")
    .replace(/[ \s]/g, "")
    .trim();

  if (!s) return null;

  let negative = false;
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (!s) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  let intPart: string;
  let fracPart: string;

  if (lastSep === -1) {
    intPart = s;
    fracPart = "00";
  } else {
    const trailing = s.length - lastSep - 1;
    if (trailing >= 1 && trailing <= 2) {
      intPart = s.slice(0, lastSep);
      fracPart = s.slice(lastSep + 1).padEnd(2, "0");
    } else {
      intPart = s;
      fracPart = "00";
    }
  }

  intPart = intPart.replace(/[.,]/g, "");

  if (intPart === "" && fracPart === "00") return null;
  if (intPart !== "" && !/^\d+$/.test(intPart)) return null;
  if (!/^\d{2}$/.test(fracPart)) return null;

  const wholeCents =
    (intPart === "" ? 0 : parseInt(intPart, 10)) * 100 +
    parseInt(fracPart, 10);
  return negative ? -wholeCents : wholeCents;
}
