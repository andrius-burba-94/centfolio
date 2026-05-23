type FormatOptions = {
  withCurrency?: boolean;
  currencySymbol?: string;
};

const NBSP = " ";

export function formatMoney(cents: number, opts?: FormatOptions): string {
  const withCurrency = opts?.withCurrency !== false;
  const currencySymbol = opts?.currencySymbol ?? "€";

  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const fractional = abs % 100;

  const eurosGrouped = euros
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fractionalPadded = fractional.toString().padStart(2, "0");

  const amount = `${sign}${eurosGrouped},${fractionalPadded}`;

  return withCurrency ? `${amount}${NBSP}${currencySymbol}` : amount;
}
