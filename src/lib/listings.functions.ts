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

const numOpt = z
  .union([z.number(), z.string()])
  .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
  .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), "invalid")
  .optional();

const boolFlag = z
  .union([z.boolean(), z.string()])
  .transform((v) => (v === true || v === "true" || v === "1"))
  .optional();

const listFilters = z
  .object({
    kind: z.enum(["home", "slip"]).optional(),
    period: z.enum(["sale", "month", "season"]).optional(),
    minPrice: numOpt,
    maxPrice: numOpt,
    minBeds: numOpt,
    minBaths: numOpt,
    minDockLen: numOpt,
    minBoatLen: numOpt,
    minDepth: numOpt,
    power: z.string().trim().max(20).optional(),
    covered: boolFlag,
    floating: boolFlag,
    water_hookup: boolFlag,
    liveaboard_allowed: boolFlag,
    tidal: boolFlag,
    state: z.string().trim().max(60).optional(),
    query: z.string().trim().max(80).optional(),
    limit: z.number().int().min(1).max(200).default(48),
  })
  .default({ limit: 48 });

function applyFilters<T extends { eq: Function; gte: Function; lte: Function; or: Function; is: Function }>(
  q: T,
  data: z.infer<typeof listFilters>,
): T {
  let out: any = q;
  if (data.kind) out = out.eq("kind", data.kind);
  if (data.period) out = out.eq("price_period", data.period);
  if (data.minPrice !== undefined) out = out.gte("price_cents", data.minPrice);
  if (data.maxPrice !== undefined) out = out.lte("price_cents", data.maxPrice);
  if (data.minBeds !== undefined) out = out.gte("bedrooms", data.minBeds);
  if (data.minBaths !== undefined) out = out.gte("bathrooms", data.minBaths);
  if (data.minDockLen !== undefined) out = out.gte("dock_length_ft", data.minDockLen);
  if (data.minBoatLen !== undefined) out = out.gte("max_boat_length_ft", data.minBoatLen);
  if (data.minDepth !== undefined) out = out.gte("water_depth_ft", data.minDepth);
  if (data.power) out = out.eq("power", data.power);
  if (data.covered) out = out.eq("covered", true);
  if (data.floating) out = out.eq("floating", true);
  if (data.water_hookup) out = out.eq("water_hookup", true);
  if (data.liveaboard_allowed) out = out.eq("liveaboard_allowed", true);
  if (data.tidal) out = out.eq("tidal", true);
  if (data.state) out = out.ilike("state", data.state);
  if (data.query) {
    const safe = data.query.replace(/[,()*.%\\]/g, " ").trim().slice(0, 80);
    if (safe) {
      const like = `%${safe}%`;
      out = out.or(
        ["title", "city", "waterway", "state"].map((c) => `${c}.ilike.${like}`).join(","),
      );
    }
  }
  return out;
}

export const listPublicListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listFilters.parse(d ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("listings")
      .select(
        "id,kind,title,price_cents,price_period,city,state,waterway,cover_photo_url,bedrooms,bathrooms,dock_length_ft,max_boat_length_ft,water_depth_ft,covered,floating,water_hookup,liveaboard_allowed,featured,lat,lng,created_at",
      )
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    q = applyFilters(q as any, data);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listMapListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listFilters.parse(d ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("listings")
      .select(
        "id,kind,title,price_cents,price_period,city,state,lat,lng,cover_photo_url,bedrooms,bathrooms,dock_length_ft,max_boat_length_ft",
      )
      .eq("status", "published")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(500);
    q = applyFilters(q as any, data);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicListing = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: listing, error } = await supabase
      .from("listings")
      .select(
        "id,owner_id,kind,listing_type,status,title,description,price_cents,price_period,city,state,country,waterway,lat,lng,cover_photo_url,bedrooms,bathrooms,sqft,lot_sqft,dock_length_ft,dock_beam_ft,water_depth_ft,max_boat_length_ft,max_boat_beam_ft,max_boat_draft_ft,power,water_hookup,covered,floating,tidal,liveaboard_allowed,nightly_price_cents,weekly_price_cents,cleaning_fee_cents,min_nights,max_nights,instant_book,max_guests,advance_notice_hours,featured,is_demo,rating_avg,rating_count,house_rules,cancellation_policy,created_at,updated_at",
      )
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!listing) return null;
    const [{ data: photos }, { data: reviews }] = await Promise.all([
      supabase
        .from("listing_photos")
        .select("id,url,sort_order,is_cover")
        .eq("listing_id", data.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("reviews")
        .select("id,rating,body,reviewer_name,created_at")
        .eq("listing_id", data.id)
        .order("created_at", { ascending: false })
        .limit(24),
    ]);
    return { listing, photos: photos ?? [], reviews: reviews ?? [] };
  });

const listingInput = z.object({
  listing_type: z.enum(["home_sale", "slip_lease", "slip_short_term"]),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(4000).optional().nullable(),
  price_cents: z.number().int().nonnegative(),
  price_period: z.enum(["sale", "month", "season"]).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  waterway: z.string().trim().max(120).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  bedrooms: z.number().int().min(0).max(30).nullable().optional(),
  bathrooms: z.number().min(0).max(30).nullable().optional(),
  sqft: z.number().int().min(0).nullable().optional(),
  dock_length_ft: z.number().min(0).nullable().optional(),
  water_depth_ft: z.number().min(0).nullable().optional(),
  max_boat_length_ft: z.number().min(0).nullable().optional(),
  max_boat_beam_ft: z.number().min(0).nullable().optional(),
  max_boat_draft_ft: z.number().min(0).nullable().optional(),
  power: z.string().trim().max(60).nullable().optional(),
  water_hookup: z.boolean().optional(),
  covered: z.boolean().optional(),
  floating: z.boolean().optional(),
  tidal: z.boolean().optional(),
  liveaboard_allowed: z.boolean().optional(),
  contact_email: z.string().email().max(160).nullable().optional(),
  contact_phone: z.string().trim().max(40).nullable().optional(),
  cover_photo_url: z.string().url().nullable().optional(),
  nightly_price_cents: z.number().int().nonnegative().nullable().optional(),
  weekly_price_cents: z.number().int().nonnegative().nullable().optional(),
  cleaning_fee_cents: z.number().int().nonnegative().optional(),
  min_nights: z.number().int().min(1).max(365).optional(),
  max_nights: z.number().int().min(1).max(365).nullable().optional(),
  instant_book: z.boolean().optional(),
  max_guests: z.number().int().min(1).max(50).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

function deriveKind(t: "home_sale" | "slip_lease" | "slip_short_term"): "home" | "slip" {
  return t === "home_sale" ? "home" : "slip";
}

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingInput.parse(d))
  .handler(async ({ data, context }) => {
    const kind = deriveKind(data.listing_type);
    const { data: row, error } = await context.supabase
      .from("listings")
      .insert({ ...data, kind, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const kind = deriveKind(rest.listing_type);
    const { error } = await context.supabase.from("listings").update({ ...rest, kind }).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listings")
      .select("id,kind,title,status,price_cents,price_period,city,state,cover_photo_url,created_at")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addListingPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        listing_id: z.string().uuid(),
        url: z.string().url(),
        is_cover: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("listing_photos").insert({
      listing_id: data.listing_id,
      url: data.url,
      is_cover: data.is_cover,
    });
    if (error) throw new Error(error.message);
    if (data.is_cover) {
      await context.supabase
        .from("listings")
        .update({ cover_photo_url: data.url })
        .eq("id", data.listing_id);
    }
    return { ok: true };
  });

const inquiryInput = z.object({
  listing_id: z.string().uuid(),
  from_name: z.string().trim().min(1).max(120),
  from_email: z.string().email().max(160),
  from_phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(2000),
});

export const sendInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inquiryInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("inquiries").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
