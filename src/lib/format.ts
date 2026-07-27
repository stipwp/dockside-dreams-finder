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
  if (period === "night") return `${s}/night`;
  return s;
}

export function locationLine(l: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  waterway?: string | null;
}): string {
  const region = l.country && l.country !== "United States" ? l.country : l.state;
  const parts = [l.city, region].filter(Boolean);
  const geo = parts.join(", ");
  return geo || l.waterway || "";
}

export function locationDetail(l: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  waterway?: string | null;
}): string {
  const geo = locationLine(l);
  return l.waterway ? (geo ? `${geo} · ${l.waterway}` : l.waterway) : geo;
}
