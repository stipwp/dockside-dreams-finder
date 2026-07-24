import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getPublicListing } from "@/lib/listings.functions";
import { getListingAvailability, createBookingRequest } from "@/lib/bookings.functions";
import { formatPrice, locationLine } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, MapPin, Ruler, Waves, Zap, Users, Zap as Bolt } from "lucide-react";
import { toast } from "sonner";

const listingQO = (id: string) =>
  queryOptions({
    queryKey: ["listings", "one", id],
    queryFn: () => getPublicListing({ data: { id } }),
  });

export const Route = createFileRoute("/rent/$id")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(listingQO(params.id));
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Dock not found — DockFront" }] };
    const l = loaderData.listing;
    const desc = (l.description ?? "").slice(0, 155) || `Rent this dock in ${locationLine(l)}`;
    const url = `https://boatanddock.lovable.app/rent/${params.id}`;
    const meta: Array<Record<string, string>> = [
      { title: `${l.title} — ${formatPrice(l.nightly_price_cents ?? l.price_cents)}/night — DockFront` },
      { name: "description", content: desc },
      { property: "og:title", content: l.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (l.cover_photo_url) {
      meta.push({ property: "og:image", content: l.cover_photo_url });
      meta.push({ name: "twitter:image", content: l.cover_photo_url });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><SiteNav /><div className="p-32 text-center"><h1 className="font-serif text-5xl">Dock not found</h1><Link to="/rent" className="mt-6 inline-block text-teak">Browse other docks →</Link></div></div>
  ),
  component: RentDetail,
});

function RentDetail() {
  const params = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <Suspense fallback={<div className="p-16 text-center text-muted-foreground">Loading…</div>}>
        <Body id={params.id} />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function Body({ id }: { id: string }) {
  const { data } = useSuspenseQuery(listingQO(id));
  if (!data) return null;
  const l = data.listing;
  const photos = data.photos.length ? data.photos : l.cover_photo_url ? [{ id: "c", url: l.cover_photo_url }] : [];
  const isShortTerm = l.listing_type === "slip_short_term";

  return (
    <div>
      <div className="bg-nav">
        <div className="mx-auto max-w-7xl px-0 md:px-8">
          <div className="aspect-[16/9] overflow-hidden bg-black">
            {photos[0] ? <img src={photos[0].url} alt={l.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Anchor className="h-16 w-16" strokeWidth={1} /></div>}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teak">
            <MapPin className="h-3.5 w-3.5" /> {locationLine(l)}
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">{l.title}</h1>

          {isShortTerm && (
            <p className="mt-4 font-serif text-3xl text-teak">
              {formatPrice(l.nightly_price_cents ?? 0)}<span className="text-lg text-muted-foreground">/night</span>
              {l.instant_book && <span className="ml-3 rounded-sm bg-teak/15 px-2 py-1 align-middle text-xs uppercase tracking-widest text-teak"><Bolt className="mr-1 inline h-3 w-3" />Instant book</span>}
            </p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 md:grid-cols-4">
            <Stat icon={<Ruler className="h-4 w-4" />} label="Max boat" value={l.max_boat_length_ft ? `${l.max_boat_length_ft}′` : "—"} />
            <Stat icon={<Ruler className="h-4 w-4" />} label="Max beam" value={l.max_boat_beam_ft ? `${l.max_boat_beam_ft}′` : "—"} />
            <Stat icon={<Waves className="h-4 w-4" />} label="Depth" value={l.water_depth_ft ? `${l.water_depth_ft}′` : "—"} />
            <Stat icon={<Zap className="h-4 w-4" />} label="Power" value={l.power ?? "—"} />
          </div>

          {l.description && <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-foreground">{l.description}</div>}

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {l.water_hookup && <Feature label="Water hookup" />}
            {l.covered && <Feature label="Covered slip" />}
            {l.floating && <Feature label="Floating dock" />}
            {l.liveaboard_allowed && <Feature label="Liveaboard OK" />}
            {l.max_guests && <Feature label={`Sleeps ${l.max_guests} aboard`} />}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {isShortTerm ? <BookingPanel listing={l} /> : (
            <div className="bg-card p-6 ring-1 ring-border">
              <p className="font-serif text-xl">This listing isn't available for nightly booking.</p>
              <Link to="/listings/$id" params={{ id: l.id }} className="mt-4 inline-block text-sm text-teak underline">View full listing details →</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return <div className="flex items-center gap-2 border border-border p-3 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-teak" /> {label}</div>;
}

type Listing = NonNullable<Awaited<ReturnType<typeof getPublicListing>>>["listing"];

function BookingPanel({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guests, setGuests] = useState(1);
  const [boatLength, setBoatLength] = useState<string>("");
  const [boatBeam, setBoatBeam] = useState<string>("");
  const [boatDraft, setBoatDraft] = useState<string>("");
  const [boatName, setBoatName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const nights = useMemo(() => {
    if (!start || !end) return 0;
    return Math.max(0, Math.round((+new Date(end) - +new Date(start)) / 86400000));
  }, [start, end]);

  const nightly = listing.nightly_price_cents ?? 0;
  const cleaning = listing.cleaning_fee_cents ?? 0;
  const subtotal = nightly * nights;
  const total = subtotal + (nights > 0 ? cleaning : 0);

  const boatOK =
    (!listing.max_boat_length_ft || !boatLength || Number(boatLength) <= Number(listing.max_boat_length_ft)) &&
    (!listing.max_boat_beam_ft || !boatBeam || Number(boatBeam) <= Number(listing.max_boat_beam_ft)) &&
    (!listing.water_depth_ft || !boatDraft || Number(boatDraft) <= Number(listing.water_depth_ft));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) {
        toast.error("Sign in to request a booking.");
        navigate({ to: "/auth" });
        return;
      }
      const res = await createBookingRequest({
        data: {
          listing_id: listing.id,
          start_date: start,
          end_date: end,
          guests,
          boat_name: boatName || undefined,
          boat_length_ft: boatLength ? Number(boatLength) : undefined,
          boat_beam_ft: boatBeam ? Number(boatBeam) : undefined,
          boat_draft_ft: boatDraft ? Number(boatDraft) : undefined,
          message: message || undefined,
        },
      });
      toast.success(res.status === "accepted" ? "Booked! Check your trips." : "Request sent to the host.");
      navigate({ to: "/trips" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-card p-6 ring-1 ring-border">
      <p className="font-serif text-2xl">{formatPrice(nightly)}<span className="text-base text-muted-foreground">/night</span></p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Arrive
          <input required type="date" value={start} onChange={(e) => setStart(e.target.value)} min={new Date().toISOString().slice(0,10)} className="mt-1 h-11 w-full rounded-sm border border-input bg-transparent px-2 text-sm text-foreground" />
        </label>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Depart
          <input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} min={start || new Date().toISOString().slice(0,10)} className="mt-1 h-11 w-full rounded-sm border border-input bg-transparent px-2 text-sm text-foreground" />
        </label>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your boat</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input placeholder="Name" value={boatName} onChange={(e) => setBoatName(e.target.value)} className="h-10 rounded-sm border border-input bg-transparent px-3 text-sm" />
          <label className="flex h-10 items-center gap-2 rounded-sm border border-input px-3 text-sm"><Users className="h-3.5 w-3.5" /><input type="number" min={1} max={listing.max_guests ?? 20} value={guests} onChange={(e) => setGuests(Number(e.target.value || 1))} className="w-full bg-transparent outline-none" /></label>
          <input placeholder="Length ft" type="number" min={0} value={boatLength} onChange={(e) => setBoatLength(e.target.value)} className="h-10 rounded-sm border border-input bg-transparent px-3 text-sm" />
          <input placeholder="Beam ft" type="number" min={0} step={0.5} value={boatBeam} onChange={(e) => setBoatBeam(e.target.value)} className="h-10 rounded-sm border border-input bg-transparent px-3 text-sm" />
          <input placeholder="Draft ft" type="number" min={0} step={0.5} value={boatDraft} onChange={(e) => setBoatDraft(e.target.value)} className="col-span-2 h-10 rounded-sm border border-input bg-transparent px-3 text-sm" />
        </div>
        {!boatOK && <p className="mt-2 text-xs text-destructive">Your boat exceeds this dock's limits.</p>}
      </div>

      <textarea rows={3} placeholder="Message to host (optional)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} className="w-full rounded-sm border border-input bg-transparent p-3 text-sm" />

      {nights > 0 && (
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <Row label={`${formatPrice(nightly)} × ${nights} night${nights === 1 ? "" : "s"}`} value={formatPrice(subtotal)} />
          {cleaning > 0 && <Row label="Cleaning fee" value={formatPrice(cleaning)} />}
          <Row label={<b>Total</b>} value={<b>{formatPrice(total)}</b>} />
        </div>
      )}

      <button disabled={busy || !boatOK || nights < 1} className="w-full rounded-sm bg-teak py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground hover:bg-teak/90 disabled:opacity-60">
        {busy ? "Sending…" : listing.instant_book ? "Book now" : "Request to book"}
      </button>
      <p className="text-[11px] text-muted-foreground">You won't be charged now — payment happens directly with the host at check-in.</p>
    </form>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

// unused import guard
void getListingAvailability;
