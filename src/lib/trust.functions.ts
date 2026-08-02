import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Boat profiles ---------------------------------------------------------

const boatInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  length_ft: z.number().nonnegative().max(500).nullable().optional(),
  beam_ft: z.number().nonnegative().max(200).nullable().optional(),
  draft_ft: z.number().nonnegative().max(100).nullable().optional(),
  air_draft_ft: z.number().nonnegative().max(300).nullable().optional(),
  power_need: z.string().trim().max(40).nullable().optional(),
  is_default: z.boolean().optional(),
});

export const listMyBoats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("boat_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveBoat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => boatInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      length_ft: data.length_ft ?? null,
      beam_ft: data.beam_ft ?? null,
      draft_ft: data.draft_ft ?? null,
      air_draft_ft: data.air_draft_ft ?? null,
      power_need: data.power_need || null,
      is_default: data.is_default ?? false,
    };

    if (row.is_default) {
      await context.supabase
        .from("boat_profiles")
        .update({ is_default: false })
        .eq("user_id", context.userId);
    }

    if (data.id) {
      const { error } = await context.supabase
        .from("boat_profiles")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("boat_profiles")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const deleteBoat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("boat_profiles")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Reports ---------------------------------------------------------------

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        target_type: z.enum(["listing", "user", "message", "booking"]),
        target_id: z.string().uuid(),
        reason: z.string().trim().min(1).max(120),
        details: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reports").insert({
      reporter_id: context.userId,
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      details: data.details || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Verification ----------------------------------------------------------

export const getMyVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("verifications")
      .select("identity_status,email_verified,phone_verified,submitted_at,reviewed_at,review_note")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const emailConfirmed = !!(context.claims as { email_verified?: boolean } | null)?.email_verified;
    return (
      data ?? {
        identity_status: "unverified" as const,
        email_verified: emailConfirmed,
        phone_verified: false,
        submitted_at: null,
        reviewed_at: null,
        review_note: null,
      }
    );
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emailConfirmed = !!(context.claims as { email_verified?: boolean } | null)?.email_verified;
    const { data: existing } = await context.supabase
      .from("verifications")
      .select("id,identity_status")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      if (existing.identity_status === "verified") return { ok: true, status: "verified" as const };
      const { error } = await context.supabase
        .from("verifications")
        .update({
          identity_status: "pending",
          email_verified: emailConfirmed,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, status: "pending" as const };
    }

    const { error } = await context.supabase.from("verifications").insert({
      user_id: context.userId,
      identity_status: "pending",
      email_verified: emailConfirmed,
      submitted_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, status: "pending" as const };
  });

// --- Notifications ---------------------------------------------------------

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id,kind,title,body,link,read_at,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).max(50).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (data.ids?.length) q = q.in("id", data.ids);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
