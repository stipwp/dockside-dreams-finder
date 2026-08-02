import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  while (d < e) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function nightsBetween(start: string, end: string): number {
  return Math.round((+new Date(end + "T00:00:00Z") - +new Date(start + "T00:00:00Z")) / 86400000);
}

// --- Public search for short-term slips ---

const rentSearch = z.object({
  where: z.string().trim().max(80).optional(),
  waterway: z.string().trim().max(80).optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  boat_length: z.coerce.number().nonnegative().optional(),
  boat_beam: z.coerce.number().nonnegative().optional(),
  boat_draft: z.coerce.number().nonnegative().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  instant: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true").optional(),
  limit: z.number().int().min(1).max(200).default(96),
});

export const searchShortTermSlips = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => rentSearch.parse(d ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("listings")
      .select(
        "id,title,city,state,country,waterway,cover_photo_url,lat,lng,nightly_price_cents,weekly_price_cents,cleaning_fee_cents,min_nights,max_nights,instant_book,max_boat_length_ft,max_boat_beam_ft,max_boat_draft_ft,max_guests,dock_length_ft,water_depth_ft,covered,floating,water_hookup,power,featured,is_demo,rating_avg,rating_count,created_at",
      )
      .eq("status", "published")
      .eq("listing_type", "slip_short_term")
      .not("nightly_price_cents", "is", null)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.boat_length !== undefined) q = q.or(`max_boat_length_ft.is.null,max_boat_length_ft.gte.${data.boat_length}`);
    if (data.boat_beam !== undefined) q = q.or(`max_boat_beam_ft.is.null,max_boat_beam_ft.gte.${data.boat_beam}`);
    if (data.boat_draft !== undefined) q = q.or(`max_boat_draft_ft.is.null,water_depth_ft.gte.${data.boat_draft}`);
    if (data.guests !== undefined) q = q.gte("max_guests", data.guests);
    if (data.instant) q = q.eq("instant_book", true);
    if (data.waterway) {
      const safeW = data.waterway.replace(/[,()*.%\\]/g, " ").trim().slice(0, 80);
      if (safeW) q = q.ilike("waterway", `%${safeW}%`);
    }
    if (data.where) {
      const safe = data.where.replace(/[,()*.%\\]/g, " ").trim().slice(0, 80);
      if (safe) {
        const like = `%${safe}%`;
        q = q.or(["title", "city", "waterway", "state", "country"].map((c) => `${c}.ilike.${like}`).join(","));
      }
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let results = rows ?? [];

    // Filter by availability for date range
    if (data.start && data.end && results.length) {
      const ids = results.map((r) => r.id);
      const [{ data: avail }, { data: bookings }] = await Promise.all([
        supabase
          .from("listing_availability")
          .select("listing_id,date,is_blocked")
          .in("listing_id", ids)
          .gte("date", data.start)
          .lt("date", data.end)
          .eq("is_blocked", true),
        supabase
          .from("bookings")
          .select("listing_id,start_date,end_date,status")
          .in("listing_id", ids)
          .in("status", ["accepted", "pending"])
          .lt("start_date", data.end)
          .gt("end_date", data.start),
      ]);
      const blocked = new Set((avail ?? []).map((a) => a.listing_id));
      const overlap = new Set((bookings ?? []).map((b) => b.listing_id));
      results = results.filter((r) => !blocked.has(r.id) && !overlap.has(r.id));
    }

    return results;
  });

// --- Availability calendar (public read for date picker) ---

export const getListingAvailability = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    listing_id: z.string().uuid(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const [{ data: avail, error: e1 }, { data: bookings, error: e2 }] = await Promise.all([
      supabase
        .from("listing_availability")
        .select("date,is_blocked,price_cents_override")
        .eq("listing_id", data.listing_id)
        .gte("date", data.from)
        .lte("date", data.to),
      supabase
        .from("bookings")
        .select("start_date,end_date,status")
        .eq("listing_id", data.listing_id)
        .in("status", ["accepted", "pending"])
        .lt("start_date", data.to)
        .gt("end_date", data.from),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { availability: avail ?? [], bookings: bookings ?? [] };
  });

// --- Create booking request ---

const bookingInput = z.object({
  listing_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(50),
  boat_name: z.string().trim().max(80).optional(),
  boat_length_ft: z.number().nonnegative().optional(),
  boat_beam_ft: z.number().nonnegative().optional(),
  boat_draft_ft: z.number().nonnegative().optional(),
  message: z.string().trim().max(2000).optional(),
});

export const createBookingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bookingInput.parse(d))
  .handler(async ({ data, context }) => {
    const nights = nightsBetween(data.start_date, data.end_date);
    if (nights < 1) throw new Error("Select at least one night.");

    const { data: listing, error: le } = await context.supabase
      .from("listings")
      .select("id,owner_id,is_demo,status,listing_type,nightly_price_cents,cleaning_fee_cents,min_nights,max_nights,instant_book,max_boat_length_ft,max_boat_beam_ft,max_boat_draft_ft,water_depth_ft,max_guests")
      .eq("id", data.listing_id)
      .eq("status", "published")
      .maybeSingle();
    if (le) throw new Error(le.message);
    if (!listing) throw new Error("Listing not available.");
    if (listing.listing_type !== "slip_short_term") throw new Error("This listing does not accept bookings.");
    if (listing.is_demo || !listing.owner_id)
      throw new Error("This is a sample dock we use to demo DockFront — it can't be booked. Try a host-listed dock.");
    if (listing.owner_id === context.userId) throw new Error("You can't book your own dock.");
    if (!listing.nightly_price_cents) throw new Error("Listing has no nightly price set.");
    if (listing.min_nights && nights < listing.min_nights) throw new Error(`Minimum stay is ${listing.min_nights} nights.`);
    if (listing.max_nights && nights > listing.max_nights) throw new Error(`Maximum stay is ${listing.max_nights} nights.`);
    if (listing.max_guests && data.guests > listing.max_guests) throw new Error(`Max ${listing.max_guests} guests.`);
    if (listing.max_boat_length_ft && data.boat_length_ft && data.boat_length_ft > Number(listing.max_boat_length_ft)) throw new Error("Boat exceeds max length.");
    if (listing.max_boat_beam_ft && data.boat_beam_ft && data.boat_beam_ft > Number(listing.max_boat_beam_ft)) throw new Error("Boat exceeds max beam.");
    if (listing.water_depth_ft && data.boat_draft_ft && data.boat_draft_ft > Number(listing.water_depth_ft)) throw new Error("Boat draft exceeds water depth.");

    // Availability check
    const dates = eachDate(data.start_date, data.end_date);
    const [{ data: blocks }, { data: overlaps }] = await Promise.all([
      context.supabase
        .from("listing_availability")
        .select("date,price_cents_override,is_blocked")
        .eq("listing_id", data.listing_id)
        .in("date", dates),
      context.supabase
        .from("bookings")
        .select("id,status")
        .eq("listing_id", data.listing_id)
        .in("status", ["accepted", "pending"])
        .lt("start_date", data.end_date)
        .gt("start_date", data.start_date === data.end_date ? data.start_date : "1900-01-01"),
    ]);
    if ((blocks ?? []).some((b) => b.is_blocked)) throw new Error("Some dates are unavailable.");

    // Cleaner overlap query
    const { data: overlap2, error: oe } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", data.listing_id)
      .in("status", ["accepted", "pending"])
      .lt("start_date", data.end_date)
      .gt("end_date", data.start_date);
    if (oe) throw new Error(oe.message);
    if ((overlap2 ?? []).length) throw new Error("These dates conflict with another booking.");
    void overlaps;

    const overrideMap = new Map<string, number>();
    (blocks ?? []).forEach((b) => { if (b.price_cents_override != null) overrideMap.set(b.date, b.price_cents_override); });
    const nightly = listing.nightly_price_cents;
    const subtotal = dates.reduce((sum, d) => sum + (overrideMap.get(d) ?? nightly), 0);
    const cleaning = listing.cleaning_fee_cents ?? 0;
    const total = subtotal + cleaning;

    const initialStatus = listing.instant_book ? "accepted" : "pending";
    const { data: row, error } = await context.supabase
      .from("bookings")
      .insert({
        listing_id: data.listing_id,
        host_id: listing.owner_id,
        guest_id: context.userId,
        start_date: data.start_date,
        end_date: data.end_date,
        guests: data.guests,
        boat_name: data.boat_name ?? null,
        boat_length_ft: data.boat_length_ft ?? null,
        boat_beam_ft: data.boat_beam_ft ?? null,
        boat_draft_ft: data.boat_draft_ft ?? null,
        message: data.message ?? null,
        nights,
        subtotal_cents: subtotal,
        cleaning_fee_cents: cleaning,
        total_cents: total,
        status: initialStatus,
      })
      .select("id,status")
      .single();
    if (error) {
      if (/bookings_no_overlap/.test(error.message))
        throw new Error("Someone just booked these dates. Pick different nights.");
      throw new Error(error.message);
    }

    await notify(
      listing.owner_id,
      "booking_request",
      initialStatus === "accepted" ? "New instant booking" : "New booking request",
      `${nights} night${nights === 1 ? "" : "s"} · ${data.guests} guest${data.guests === 1 ? "" : "s"}`,
      `/bookings/${row.id}`,
    );
    return row;
  });

export const respondToBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    action: z.enum(["accept", "decline"]),
    note: z.string().trim().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: booking, error: be } = await context.supabase
      .from("bookings").select("id,host_id,guest_id,status").eq("id", data.id).maybeSingle();
    if (be) throw new Error(be.message);
    if (!booking) throw new Error("Booking not found.");
    if (booking.host_id !== context.userId) throw new Error("Only the host can respond.");
    if (booking.status !== "pending") throw new Error("Booking is not pending.");
    const { error } = await context.supabase.from("bookings").update({
      status: data.action === "accept" ? "accepted" : "declined",
      host_note: data.note ?? null,
    }).eq("id", data.id);
    if (error) {
      if (/bookings_no_overlap/.test(error.message))
        throw new Error("Another booking already holds these dates. Decline this one or free the dates first.");
      throw new Error(error.message);
    }
    await notify(
      booking.guest_id,
      `booking_${data.action}ed`,
      data.action === "accept" ? "Your dock is confirmed" : "Booking request declined",
      data.note || null,
      `/bookings/${data.id}`,
    );
    return { ok: true };
  });

/** Refund preview the guest sees before confirming a cancellation. */
export const previewCancellation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase
      .from("bookings")
      .select("guest_id,host_id,status,start_date,subtotal_cents,cleaning_fee_cents,listings(cancellation_policy)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guest_id !== context.userId && booking.host_id !== context.userId)
      throw new Error("Not authorized.");
    return quoteRefund(booking, booking.listings?.cancellation_policy, new Date());
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: booking, error: be } = await context.supabase
      .from("bookings")
      .select("guest_id,host_id,status,start_date,subtotal_cents,cleaning_fee_cents,listings(cancellation_policy)")
      .eq("id", data.id)
      .maybeSingle();
    if (be) throw new Error(be.message);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guest_id !== context.userId && booking.host_id !== context.userId) throw new Error("Not authorized.");
    if (booking.status === "cancelled" || booking.status === "declined") return { ok: true };

    // Host-initiated cancellations always refund the guest in full.
    const cancelledByHost = booking.host_id === context.userId;
    const quote = cancelledByHost
      ? quoteRefund(booking, "flexible", new Date(booking.start_date + "T00:00:00Z"))
      : quoteRefund(booking, booking.listings?.cancellation_policy, new Date());

    const { error } = await context.supabase
      .from("bookings")
      .update({
        status: "cancelled",
        host_note: `Cancelled by ${cancelledByHost ? "host" : "guest"} · refund ${quote.refundPct}% of nightly total`,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await notify(
      cancelledByHost ? booking.guest_id : booking.host_id,
      "booking_cancelled",
      "Booking cancelled",
      quote.explanation,
      `/bookings/${data.id}`,
    );
    return { ok: true, refund: quote };
  });

export const listMyTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("id,listing_id,start_date,end_date,nights,total_cents,status,created_at,listings(id,title,city,state,cover_photo_url)")
      .eq("guest_id", context.userId)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyHostBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("id,listing_id,start_date,end_date,nights,total_cents,status,created_at,guests,boat_name,boat_length_ft,message,listings(id,title,city,state,cover_photo_url)")
      .eq("host_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: b, error } = await context.supabase
      .from("bookings")
      .select("*,listings(id,title,city,state,cover_photo_url,owner_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!b) return null;
    if (b.guest_id !== context.userId && b.host_id !== context.userId) throw new Error("Not authorized.");
    return b;
  });

// --- Messages ---

export const listBookingMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("booking_messages")
      .select("id,sender_id,body,created_at")
      .eq("booking_id", data.booking_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendBookingMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    booking_id: z.string().uuid(),
    body: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("booking_messages").insert({
      booking_id: data.booking_id,
      sender_id: context.userId,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Host availability management ---

export const setAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    listing_id: z.string().uuid(),
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(370),
    is_blocked: z.boolean(),
    price_cents_override: z.number().int().nonnegative().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: l, error: le } = await context.supabase
      .from("listings").select("owner_id").eq("id", data.listing_id).maybeSingle();
    if (le) throw new Error(le.message);
    if (!l || l.owner_id !== context.userId) throw new Error("Not authorized.");

    const rows = data.dates.map((date) => ({
      listing_id: data.listing_id,
      date,
      is_blocked: data.is_blocked,
      price_cents_override: data.price_cents_override ?? null,
    }));
    const { error } = await context.supabase
      .from("listing_availability")
      .upsert(rows, { onConflict: "listing_id,date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    listing_id: z.string().uuid(),
    dates: z.array(z.string()).min(1).max(370),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: l } = await context.supabase.from("listings").select("owner_id").eq("id", data.listing_id).maybeSingle();
    if (!l || l.owner_id !== context.userId) throw new Error("Not authorized.");
    const { error } = await context.supabase
      .from("listing_availability")
      .delete()
      .eq("listing_id", data.listing_id)
      .in("date", data.dates);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getListingForHost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: l, error } = await context.supabase
      .from("listings")
      .select("id,title,listing_type,nightly_price_cents,cleaning_fee_cents")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!l) return null;
    return l;
  });
