import { z } from "zod";

export const rentSearchSchema = z.object({
  where: z.string().max(80).optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  boat_length: z.coerce.number().nonnegative().optional(),
  boat_beam: z.coerce.number().nonnegative().optional(),
  boat_draft: z.coerce.number().nonnegative().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  instant: z.coerce.boolean().optional(),
  view: z.enum(["grid", "map"]).optional(),
});

export type RentSearch = z.infer<typeof rentSearchSchema>;

export function toServerRent(s: RentSearch) {
  return {
    where: s.where || undefined,
    start: s.start,
    end: s.end,
    boat_length: s.boat_length,
    boat_beam: s.boat_beam,
    boat_draft: s.boat_draft,
    guests: s.guests,
    instant: s.instant || undefined,
    limit: 48,
  };
}

export function activeRentCount(s: RentSearch): number {
  let n = 0;
  (["start","end","boat_length","boat_beam","boat_draft","guests","instant"] as const).forEach((k) => {
    if (s[k] !== undefined && s[k] !== "" && s[k] !== false) n++;
  });
  return n;
}
