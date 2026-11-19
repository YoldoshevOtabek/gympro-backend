export function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDecimal(cents));
}