export function formatCentsToDollars(cents: number): string {
  const isNegative = cents < 0;
  const absoluteCents = Math.abs(cents);
  const dollars = Math.floor(absoluteCents / 100);
  const remainderCents = absoluteCents % 100;
  const paddedCents = remainderCents < 10 ? `0${remainderCents}` : `${remainderCents}`;
  const sign = isNegative ? "-" : "";
  return `${sign}$${dollars.toLocaleString("en-US")}.${paddedCents}`;
}

export function parseDollarsToCents(amountString: string): number {
  const cleaned = amountString.replace(/[^0-9.]/g, "");
  if (cleaned.length === 0) {
    return 0;
  }
  const parts = cleaned.split(".");
  const dollars = parseInt(parts[0], 10) || 0;
  let cents = 0;
  if (parts.length > 1) {
    const fractionalPart = (parts[1] + "00").slice(0, 2);
    cents = parseInt(fractionalPart, 10) || 0;
  }
  return dollars * 100 + cents;
}
