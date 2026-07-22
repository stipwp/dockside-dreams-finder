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

const listFilters = z
  .object({
    kind: z.enum(["home", "slip"]).optional(),
    minPrice: z.number().int().nonnegative().optional(),
    maxPrice: z.number().int().nonnegative().optional(),
    query: z.string().trim().max(80).optional(),
    limit: z.number().int().min(1).max(60).default(24),
  })
  .default({ limit: 24 });

export const listPublicListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listFilters.parse(d ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("listings")
      .select(
        "id,kind,title,price_cents,price_period,city,state,waterway,cover_photo_url,bedrooms,bathrooms,dock_length_ft,max_boat_length_ft,featured,created_at",
      )
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.minPrice !== undefined) q = q.gte("price_cents", data.minPrice);
    if (data.maxPrice !== undefined) q = q.lte("price_cents", data.maxPrice);
    if (data.query) q = q.or(`title.ilike.%${data.query}%,city.ilike.%${data.query}%,waterway.ilike.%${data.query}%`);
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
      .select("*")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!listing) return null;
    const { data: photos } = await supabase
      .from("listing_photos")
      .select("id,url,sort_order,is_cover")
      .eq("listing_id", data.id)
      .order("sort_order", { ascending: true });
    return { listing, photos: photos ?? [] };
  });

const listingInput = z.object({
  kind: z.enum(["home", "slip"]),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(4000).optional().nullable(),
  price_cents: z.number().int().nonnegative(),
  price_period: z.enum(["sale", "month", "season"]).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  waterway: z.string().trim().max(120).nullable().optional(),
  bedrooms: z.number().int().min(0).max(30).nullable().optional(),
  bathrooms: z.number().min(0).max(30).nullable().optional(),
  sqft: z.number().int().min(0).nullable().optional(),
  dock_length_ft: z.number().min(0).nullable().optional(),
  water_depth_ft: z.number().min(0).nullable().optional(),
  max_boat_length_ft: z.number().min(0).nullable().optional(),
  power: z.string().trim().max(60).nullable().optional(),
  water_hookup: z.boolean().optional(),
  covered: z.boolean().optional(),
  floating: z.boolean().optional(),
  tidal: z.boolean().optional(),
  liveaboard_allowed: z.boolean().optional(),
  contact_email: z.string().email().max(160).nullable().optional(),
  contact_phone: z.string().trim().max(40).nullable().optional(),
  cover_photo_url: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("listings")
      .insert({ ...data, owner_id: context.userId })
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
    const { error } = await context.supabase.from("listings").update(rest).eq("id", id);
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
