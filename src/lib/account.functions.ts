import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Entitlements = {
  tier: "free" | "host_pro" | "captain";
  maxActiveListings: number | null;
  instantBook: boolean;
  featuredEligible: boolean;
  savedSearchAlerts: boolean;
  currentPeriodEnd: string | null;
};

export const getMyEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Entitlements> => {
    const { data: rows, error } = await context.supabase
      .from("subscriptions")
      .select("tier,status,current_period_end")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    const now = Date.now();
    const active = (rows ?? []).filter(
      (r) =>
        (r.status === "active" || r.status === "trialing") &&
        (!r.current_period_end || +new Date(r.current_period_end) > now),
    );
    const hostPro = active.find((r) => r.tier === "host_pro");
    const captain = active.find((r) => r.tier === "captain");
    const chosen = hostPro ?? captain ?? null;

    return {
      tier: (chosen?.tier as Entitlements["tier"]) ?? "free",
      maxActiveListings: hostPro ? null : 1,
      instantBook: !!hostPro,
      featuredEligible: !!hostPro,
      savedSearchAlerts: !!(hostPro || captain),
      currentPeriodEnd: chosen?.current_period_end ?? null,
    };
  });

export const getHostUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await context.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .eq("status", "published");
    if (error) throw new Error(error.message);
    return { publishedListings: count ?? 0 };
  });

// --- Saved searches ---

export const listSavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_searches")
      .select("id,name,params,alerts_enabled,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        params: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("saved_searches").insert({
      user_id: context.userId,
      name: data.name,
      params: data.params as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("saved_searches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Wishlist ---

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select(
        "listing_id,created_at,listings(id,title,city,state,country,waterway,cover_photo_url,nightly_price_cents,instant_book,max_boat_length_ft,water_depth_ft,rating_avg,rating_count,status)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((r) => r.listings)
      .filter((l): l is NonNullable<typeof l> => !!l && l.status === "published");
  });

// --- Profile ---

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id,full_name,phone,avatar_url,created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data, email: (context.claims as { email?: string } | null)?.email ?? null };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().max(80).optional(),
        phone: z.string().trim().max(30).optional(),
        avatar_url: z.string().trim().url().max(500).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name || null,
        phone: data.phone || null,
        avatar_url: data.avatar_url || null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Counts powering the account dashboard tiles. */
export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [trips, hosting, listings, saved, pending] = await Promise.all([
      context.supabase.from("bookings").select("id", { count: "exact", head: true }).eq("guest_id", uid),
      context.supabase.from("bookings").select("id", { count: "exact", head: true }).eq("host_id", uid),
      context.supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", uid),
      context.supabase.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", uid),
      context.supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("host_id", uid)
        .eq("status", "pending"),
    ]);
    return {
      trips: trips.count ?? 0,
      hosting: hosting.count ?? 0,
      listings: listings.count ?? 0,
      saved: saved.count ?? 0,
      pendingRequests: pending.count ?? 0,
    };
  });
