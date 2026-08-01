import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listReviewableStays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: bookings, error } = await context.supabase
      .from("bookings")
      .select("id,listing_id,end_date,listings(id,title,city,state,country,cover_photo_url)")
      .eq("guest_id", context.userId)
      .eq("status", "accepted")
      .lte("end_date", today)
      .order("end_date", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (bookings ?? []).map((b) => b.id);
    if (!ids.length) return [];
    const { data: existing } = await context.supabase
      .from("reviews")
      .select("booking_id")
      .in("booking_id", ids);
    const done = new Set((existing ?? []).map((r) => r.booking_id));
    return (bookings ?? []).filter((b) => !done.has(b.id));
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        booking_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: booking, error: be } = await context.supabase
      .from("bookings")
      .select("id,listing_id,guest_id,status,end_date")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (be) throw new Error(be.message);
    if (!booking || booking.guest_id !== context.userId) throw new Error("Stay not found.");
    if (booking.status !== "accepted") throw new Error("Only completed stays can be reviewed.");
    if (booking.end_date > new Date().toISOString().slice(0, 10))
      throw new Error("You can review after your stay ends.");

    const { error } = await context.supabase.from("reviews").insert({
      listing_id: booking.listing_id,
      booking_id: booking.id,
      reviewer_id: context.userId,
      rating: data.rating,
      body: data.body ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
