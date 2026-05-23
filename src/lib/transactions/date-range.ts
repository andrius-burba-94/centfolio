export type DateRangeName =
  | "this-month"
  | "last-month"
  | "this-year"
  | "all"
  | "custom";

export type DateRange = {
  name: DateRangeName;
  from?: string;
  to?: string;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function firstOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function lastOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0));
}

/**
 * Compute concrete from/to date strings for a named range. Uses UTC math
 * for stable boundaries; client and server agree on the same window
 * regardless of local timezone. Centfolio is Europe/Vilnius for now but
 * the comparison is date-only (no time-of-day), so UTC is safe here.
 */
export function rangeBounds(
  name: DateRangeName,
  now: Date = new Date(),
): { from?: string; to?: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  switch (name) {
    case "this-month":
      return { from: isoDate(firstOfMonth(y, m)), to: isoDate(lastOfMonth(y, m)) };
    case "last-month": {
      const prevYear = m === 0 ? y - 1 : y;
      const prevMonth = m === 0 ? 11 : m - 1;
      return {
        from: isoDate(firstOfMonth(prevYear, prevMonth)),
        to: isoDate(lastOfMonth(prevYear, prevMonth)),
      };
    }
    case "this-year":
      return {
        from: isoDate(new Date(Date.UTC(y, 0, 1))),
        to: isoDate(new Date(Date.UTC(y, 11, 31))),
      };
    case "all":
      return {};
    case "custom":
      return {};
  }
}

export function resolveRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): DateRange {
  const name = (params.range ?? "this-month") as DateRangeName;
  if (name === "custom") {
    return { name: "custom", from: params.from, to: params.to };
  }
  if (
    name === "this-month" ||
    name === "last-month" ||
    name === "this-year" ||
    name === "all"
  ) {
    const bounds = rangeBounds(name);
    return { name, from: bounds.from, to: bounds.to };
  }
  // Fallback: unknown range value, default to this-month.
  const bounds = rangeBounds("this-month");
  return { name: "this-month", ...bounds };
}
