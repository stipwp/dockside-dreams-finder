import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  getAccountOverview,
  getMyEntitlements,
  getMyProfile,
  updateMyProfile,
} from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { BoatProfiles } from "@/components/boat-profiles";
import { VerificationCard } from "@/components/verification-card";
import { toast } from "sonner";
import { Anchor, CalendarCheck, Heart, Inbox, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [{ title: "Your account — DockFront" }, { name: "robots", content: "noindex" }],
  }),
  component: Account,
});

function Account() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchOverview = useServerFn(getAccountOverview);
  const fetchEntitlements = useServerFn(getMyEntitlements);

  const { data: profileData } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const { data: overview } = useQuery({ queryKey: ["account-overview"], queryFn: () => fetchOverview() });
  const { data: ent } = useQuery({ queryKey: ["entitlements"], queryFn: () => fetchEntitlements() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!profileData) return;
    setFullName(profileData.profile?.full_name ?? "");
    setPhone(profileData.profile?.phone ?? "");
    setAvatar(profileData.profile?.avatar_url ?? "");
  }, [profileData]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile({ data: { full_name: fullName, phone, avatar_url: avatar } }),
    onSuccess: () => {
      toast.success("Profile saved.");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const initials = (fullName || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-foreground text-2xl font-bold text-background">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{fullName || "Your account"}</h1>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile to="/trips" icon={<CalendarCheck className="h-5 w-5" />} label="Trips" value={overview?.trips} />
          <Tile to="/bookings" icon={<Inbox className="h-5 w-5" />} label="Requests" value={overview?.pendingRequests} />
          <Tile to="/dashboard" icon={<Anchor className="h-5 w-5" />} label="Listings" value={overview?.listings} />
          <Tile to="/wishlists" icon={<Heart className="h-5 w-5" />} label="Saved" value={overview?.saved} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="rounded-2xl border border-border p-6"
          >
            <h2 className="text-lg font-bold">Personal info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-foreground"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-foreground"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Avatar image URL">
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://…"
                    className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-foreground"
                  />
                </Field>
              </div>
            </div>
            <button
              type="submit"
              disabled={save.isPending}
              className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Save profile"}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold">Your plan</h2>
            <p className="mt-2 text-sm capitalize text-muted-foreground">
              {(ent?.tier ?? "free").replace("_", " ")} plan
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                Active listings allowed: {ent?.maxActiveListings === null ? "Unlimited" : (ent?.maxActiveListings ?? 1)}
              </li>
              <li>Instant Book: {ent?.instantBook ? "Enabled" : "Host Pro only"}</li>
              <li>Featured placement: {ent?.featuredEligible ? "Eligible" : "Host Pro only"}</li>
            </ul>
            <Link
              to="/pricing"
              className="mt-5 block rounded-xl bg-foreground py-3 text-center text-sm font-bold text-background"
            >
              Compare plans
            </Link>
            <Link
              to="/reviews"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold"
            >
              <Star className="h-4 w-4" /> Write a review
            </Link>
            <button
              onClick={signOut}
              className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:text-destructive"
            >
              Log out
            </button>
          </aside>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <BoatProfiles />
          <VerificationCard />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Tile({
  to,
  icon,
  label,
  value,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border p-4 transition-shadow hover:shadow-card"
    >
      <span className="text-muted-foreground">{icon}</span>
      <p className="mt-3 text-2xl font-extrabold">{value ?? "—"}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}
