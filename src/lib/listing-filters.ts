import { z } from "zod";

export const listingSearchSchema = z.object({
  kind: z.enum(["home", "slip"]).optional(),
  period: z.enum(["sale", "month", "season"]).optional(),
  q: z.string().max(80).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minBeds: z.coerce.number().int().nonnegative().optional(),
  minBaths: z.coerce.number().nonnegative().optional(),
  minDockLen: z.coerce.number().nonnegative().optional(),
  minBoatLen: z.coerce.number().nonnegative().optional(),
  minDepth: z.coerce.number().nonnegative().optional(),
  power: z.string().max(20).optional(),
  state: z.string().max(60).optional(),
  covered: z.coerce.boolean().optional(),
  floating: z.coerce.boolean().optional(),
  water_hookup: z.coerce.boolean().optional(),
  liveaboard_allowed: z.coerce.boolean().optional(),
  tidal: z.coerce.boolean().optional(),
  view: z.enum(["grid", "map"]).optional(),
});

export type ListingSearch = z.infer<typeof listingSearchSchema>;

export function toServerFilters(s: ListingSearch) {
  const price = s.minPrice !== undefined ? s.minPrice * 100 : undefined;
  const maxPrice = s.maxPrice !== undefined ? s.maxPrice * 100 : undefined;
  return {
    kind: s.kind,
    period: s.period,
    query: s.q,
    minPrice: price,
    maxPrice,
    minBeds: s.minBeds,
    minBaths: s.minBaths,
    minDockLen: s.minDockLen,
    minBoatLen: s.minBoatLen,
    minDepth: s.minDepth,
    power: s.power || undefined,
    state: s.state || undefined,
    covered: s.covered || undefined,
    floating: s.floating || undefined,
    water_hookup: s.water_hookup || undefined,
    liveaboard_allowed: s.liveaboard_allowed || undefined,
    tidal: s.tidal || undefined,
    limit: 60,
  };
}

export function activeFilterCount(s: ListingSearch): number {
  let n = 0;
  const keys: (keyof ListingSearch)[] = [
    "kind","period","minPrice","maxPrice","minBeds","minBaths","minDockLen",
    "minBoatLen","minDepth","power","state","covered","floating",
    "water_hookup","liveaboard_allowed","tidal",
  ];
  for (const k of keys) if (s[k] !== undefined && s[k] !== "" && s[k] !== false) n++;
  return n;
}
