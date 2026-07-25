import { z } from "zod";

export const rentSearchSchema = z.object({
  where: z.string().max(80).optional(),
  waterway: z.string().max(80).optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  boat_length: z.coerce.number().nonnegative().optional(),
  boat_beam: z.coerce.number().nonnegative().optional(),
  boat_draft: z.coerce.number().nonnegative().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  instant: z.coerce.boolean().optional(),
  view: z.enum(["grid", "map", "split"]).optional(),
  radius_mi: z.coerce.number().positive().max(500).optional(),
  near_lat: z.coerce.number().min(-90).max(90).optional(),
  near_lng: z.coerce.number().min(-180).max(180).optional(),
});

export type RentSearch = z.infer<typeof rentSearchSchema>;

export function toServerRent(s: RentSearch) {
  return {
    where: s.where || undefined,
    waterway: s.waterway || undefined,
    start: s.start,
    end: s.end,
    boat_length: s.boat_length,
    boat_beam: s.boat_beam,
    boat_draft: s.boat_draft,
    guests: s.guests,
    instant: s.instant || undefined,
    limit: 96,
  };
}

export function activeRentCount(s: RentSearch): number {
  let n = 0;
  (["start","end","boat_length","boat_beam","boat_draft","guests","instant","waterway","radius_mi"] as const).forEach((k) => {
    if (s[k] !== undefined && s[k] !== "" && s[k] !== false) n++;
  });
  return n;
}

// Haversine distance in miles
export function distanceMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
