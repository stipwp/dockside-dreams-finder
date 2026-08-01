import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

let cache: Set<string> | null = null;
const listeners = new Set<(s: Set<string>) => void>();

function broadcast(next: Set<string>) {
  cache = next;
  listeners.forEach((fn) => fn(new Set(next)));
}

async function load() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    broadcast(new Set());
    return;
  }
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", auth.user.id);
  broadcast(new Set((data ?? []).map((r) => r.listing_id)));
}

/** Wishlist state backed by the favorites table (RLS-scoped to the signed-in user). */
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => new Set(cache ?? []));

  useEffect(() => {
    listeners.add(setIds);
    if (cache === null) void load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") void load();
    });
    return () => {
      listeners.delete(setIds);
      sub.subscription.unsubscribe();
    };
  }, []);

  const toggle = useCallback(async (listingId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { needsAuth: true as const };

    const current = new Set(cache ?? []);
    const saved = current.has(listingId);
    // optimistic
    if (saved) current.delete(listingId);
    else current.add(listingId);
    broadcast(current);

    const { error } = saved
      ? await supabase.from("favorites").delete().eq("user_id", auth.user.id).eq("listing_id", listingId)
      : await supabase.from("favorites").insert({ user_id: auth.user.id, listing_id: listingId });

    if (error) {
      void load();
      return { error: error.message };
    }
    return { saved: !saved };
  }, []);

  return { ids, isSaved: (id: string) => ids.has(id), toggle };
}
