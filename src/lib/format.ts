export function formatPrice(cents: number, period?: string | null): string {
  const dollars = Math.round(cents / 100);
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
  if (!period || period === "sale") return s;
  if (period === "month") return `${s}/mo`;
  if (period === "season") return `${s}/season`;
  return s;
}

export function locationLine(l: {
  city?: string | null;
  state?: string | null;
  waterway?: string | null;
}): string {
  const parts = [l.city, l.state].filter(Boolean);
  const geo = parts.join(", ");
  return l.waterway ? (geo ? `${geo} · ${l.waterway}` : l.waterway) : geo;
}
