import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Throws unless the caller holds the admin role. Uses the caller's own client. */
async function assertAdmin(context: { supabase: typeof import("@/integrations/supabase/client").supabase; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: !!data };
  });

async function audit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    detail: detail as never,
  });
}

// --- Overview --------------------------------------------------------------

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [openReports, pendingIds, listings, drafts, bookings, users] = await Promise.all([
      context.supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      context.supabase
        .from("verifications")
        .select("id", { count: "exact", head: true })
        .eq("identity_status", "pending"),
      context.supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
      context.supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "draft"),
      context.supabase.from("bookings").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    return {
      openReports: openReports.count ?? 0,
      pendingVerifications: pendingIds.count ?? 0,
      publishedListings: listings.count ?? 0,
      draftListings: drafts.count ?? 0,
      bookings: bookings.count ?? 0,
      users: users.count ?? 0,
    };
  });

// --- Reports ---------------------------------------------------------------

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("reports")
      .select("id,target_type,target_id,reason,details,status,resolution_note,created_at,reporter_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["reviewing", "resolved", "dismissed"]),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("reports")
      .update({
        status: data.status,
        resolution_note: data.note || null,
        resolved_by: context.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context.userId, `report_${data.status}`, "report", data.id, { note: data.note });
    return { ok: true };
  });

// --- Listing moderation ----------------------------------------------------

export const adminListListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("listings")
      .select("id,title,city,country,status,listing_type,owner_id,is_demo,featured,created_at,nightly_price_cents")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as "draft" | "published" | "sold_rented");
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSetListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published", "sold_rented"]),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context.userId, "listing_status", "listing", data.id, {
      status: data.status,
      reason: data.reason,
    });
    return { ok: true };
  });

export const adminSetFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), featured: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("listings")
      .update({ featured: data.featured })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context.userId, "listing_featured", "listing", data.id, { featured: data.featured });
    return { ok: true };
  });

// --- Verifications ---------------------------------------------------------

export const adminListVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("verifications")
      .select("id,user_id,identity_status,email_verified,phone_verified,submitted_at,review_note")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminReviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["verified", "rejected"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("verifications")
      .update({
        identity_status: data.decision,
        review_note: data.note || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context.userId, `verification_${data.decision}`, "verification", data.id, { note: data.note });
    return { ok: true };
  });

// --- Users -----------------------------------------------------------------

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id,full_name,suspended_at,suspension_reason,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You can't suspend your own account.");
    const { error } = await context.supabase
      .from("profiles")
      .update({
        suspended_at: data.suspended ? new Date().toISOString() : null,
        suspension_reason: data.suspended ? data.reason || "Policy violation" : null,
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    await audit(context.userId, data.suspended ? "user_suspended" : "user_reinstated", "user", data.user_id, {
      reason: data.reason,
    });
    return { ok: true };
  });

// --- Audit log -------------------------------------------------------------

export const adminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_audit_log")
      .select("id,admin_id,action,target_type,target_id,detail,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
