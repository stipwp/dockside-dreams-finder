import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { DockCard } from "@/components/dock-card";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { getPublicListing } from "@/lib/listings.functions";
import { createBookingRequest, searchShortTermSlips } from "@/lib/bookings.functions";
import { formatPrice, locationLine } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";
import {
  Anchor,
  CalendarDays,
  Grid2x2,
  Heart,
  MapPin,
  Ruler,
  Share,
  Star,
  Waves,
  Zap,
  Users,
  ShieldCheck,
  Plug,
  Droplets,
  Umbrella,
  Ship,
} from "lucide-react";
import { toast } from "sonner";


const listingQO = (id: string) =>
  queryOptions({
    queryKey: ["listings", "one", id],
    queryFn: () => getPublicListing({ data: { id } }),
  });

export const Route = createFileRoute("/rent_/$id")({
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
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="p-32 text-center">
        <h1 className="text-4xl font-extrabold">Dock not found</h1>
        <Link to="/rent" className="mt-6 inline-block font-semibold text-primary underline">
          Browse other docks →
        </Link>
      </div>
    </div>
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
  const { isSaved, toggle } = useFavorites();
  const navigate = useNavigate();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  if (!data) return null;

  const l = data.listing;
  const reviews = data.reviews;
  const photos = data.photos.length
    ? data.photos
    : l.cover_photo_url
      ? [{ id: "c", url: l.cover_photo_url }]
      : [];
  const isShortTerm = l.listing_type === "slip_short_term";
  const saved = isSaved(l.id);

  async function onSave() {
    const res = await toggle(l.id);
    if (res.needsAuth) {
      toast.error("Sign in to save this dock.");
      navigate({ to: "/auth" });
    } else if (res.error) toast.error("Couldn't update your wishlist.");
  }

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: l.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  }

  const amenities = [
    l.water_hookup && { icon: <Droplets className="h-5 w-5" />, label: "Fresh water hookup" },
    l.power && { icon: <Plug className="h-5 w-5" />, label: `Shore power — ${l.power}` },
    l.covered && { icon: <Umbrella className="h-5 w-5" />, label: "Covered slip" },
    l.floating && { icon: <Waves className="h-5 w-5" />, label: "Floating dock" },
    l.liveaboard_allowed && { icon: <Ship className="h-5 w-5" />, label: "Liveaboard welcome" },
    l.max_guests && { icon: <Users className="h-5 w-5" />, label: `Up to ${l.max_guests} aboard` },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;

  return (
    <div className="mx-auto max-w-[68rem] px-4 pb-20 md:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pt-6 sm:flex sm:justify-between">
        <h1 className="min-w-0 text-2xl font-extrabold tracking-tight md:text-[26px]">{l.title}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onShare}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline-offset-2 hover:bg-muted hover:underline"
          >
            <Share className="h-4 w-4" /> Share
          </button>
          <button
            onClick={onSave}
            aria-pressed={saved}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline-offset-2 hover:bg-muted hover:underline"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Photo mosaic */}
      <div className="relative">
        <div className="mt-4 grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
          <button
            type="button"
            onClick={() => photos.length && setLightbox(0)}
            aria-label="View photo 1"
            className="aspect-[4/3] bg-muted md:col-span-2 md:row-span-2 md:aspect-auto"
          >
            {photos[0] ? (
              <img
                src={photos[0].url}
                alt={l.title}
                className="h-full w-full object-cover transition-opacity hover:opacity-90"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Anchor className="h-14 w-14" strokeWidth={1} />
              </div>
            )}
          </button>
          {photos.slice(1, 5).map((p, i) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setLightbox(i + 1)}
              aria-label={`View photo ${i + 2}`}
              className="hidden aspect-[4/3] bg-muted md:block"
            >
              <img
                src={p.url}
                alt={`${l.title} photo ${i + 2}`}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity hover:opacity-90"
              />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold shadow-card transition-transform hover:scale-[1.02]"
          >
            <Grid2x2 className="h-4 w-4" /> Show all {photos.length} photos
          </button>
        )}
      </div>

      {lightbox !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightbox}
          title={l.title}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}


      <div className="grid gap-12 pt-8 lg:grid-cols-[1fr_26rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold">Dock in {locationLine(l)}</h2>
            {l.instant_book && (
              <span className="inline-flex items-center gap-1 rounded-full bg-buoy/10 px-2.5 py-1 text-xs font-semibold text-buoy">
                <Zap className="h-3 w-3" /> Instant book
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {locationLine(l)}
            {l.waterway ? ` · ${l.waterway}` : ""}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
            <Star className="h-4 w-4 fill-foreground" />
            {l.rating_count ? `${Number(l.rating_avg ?? 0).toFixed(2)} · ${l.rating_count} review${l.rating_count === 1 ? "" : "s"}` : "New dock"}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-6 md:grid-cols-4">
            <Stat icon={<Ruler className="h-4 w-4" />} label="Max LOA" value={l.max_boat_length_ft ? `${l.max_boat_length_ft}′` : "—"} />
            <Stat icon={<Ruler className="h-4 w-4" />} label="Max beam" value={l.max_boat_beam_ft ? `${l.max_boat_beam_ft}′` : "—"} />
            <Stat icon={<Waves className="h-4 w-4" />} label="Depth (MLW)" value={l.water_depth_ft ? `${l.water_depth_ft}′` : "—"} />
            <Stat icon={<Anchor className="h-4 w-4" />} label="Dock length" value={l.dock_length_ft ? `${l.dock_length_ft}′` : "—"} />
          </div>

          {l.description && (
            <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{l.description}</div>
          )}

          {amenities.length > 0 && (
            <section className="mt-10 border-t border-border pt-8">
              <h3 className="text-xl font-bold">What this dock offers</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {amenities.map((a) => (
                  <div key={a.label} className="flex items-center gap-3 text-[15px]">
                    <span className="text-muted-foreground">{a.icon}</span> {a.label}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(l.house_rules || l.cancellation_policy) && (
            <section className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
              {l.house_rules && (
                <div>
                  <h3 className="text-lg font-bold">Dock rules</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{l.house_rules}</p>
                </div>
              )}
              {l.cancellation_policy && (
                <div>
                  <h3 className="text-lg font-bold">Cancellation</h3>
                  <p className="mt-2 text-sm capitalize text-muted-foreground">{l.cancellation_policy}</p>
                </div>
              )}
            </section>
          )}

          <section className="mt-10 border-t border-border pt-8">
            <h3 className="text-xl font-bold">Good to know</h3>
            <div className="mt-4 grid gap-4 text-[15px] sm:grid-cols-2">
              <Fact label="Minimum stay" value={`${l.min_nights} night${l.min_nights === 1 ? "" : "s"}`} />
              {l.max_nights ? <Fact label="Maximum stay" value={`${l.max_nights} nights`} /> : null}
              <Fact
                label="Advance notice"
                value={l.advance_notice_hours ? `${l.advance_notice_hours} hours` : "Same-day OK"}
              />
              <Fact label="Booking" value={l.instant_book ? "Instant book" : "Host reviews each request"} />
              <Fact label="Cleaning fee" value={l.cleaning_fee_cents ? formatPrice(l.cleaning_fee_cents) : "None"} />
              {l.weekly_price_cents ? (
                <Fact label="Weekly rate" value={`${formatPrice(l.weekly_price_cents)} / week`} />
              ) : null}
              <Fact label="Tide" value={l.tidal ? "Tidal berth" : "Non-tidal"} />
              <Fact label="Max boat draft" value={l.max_boat_draft_ft ? `${l.max_boat_draft_ft}′` : "On request"} />
            </div>
          </section>

          {isShortTerm && (
            <section className="mt-10 border-t border-border pt-8">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <CalendarDays className="h-5 w-5" /> Availability
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {start && end
                  ? `${new Date(`${start}T00:00:00`).toLocaleDateString()} → ${new Date(`${end}T00:00:00`).toLocaleDateString()}`
                  : "Pick your arrival and departure to see the total."}
              </p>
              <div className="mt-5">
                <AvailabilityCalendar
                  listingId={l.id}
                  start={start}
                  end={end}
                  onChange={(s, e) => {
                    setStart(s);
                    setEnd(e);
                  }}
                />
              </div>
            </section>
          )}



          <section className="mt-10 border-t border-border pt-8">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <Star className="h-5 w-5 fill-foreground" />
              {l.rating_count
                ? `${Number(l.rating_avg ?? 0).toFixed(2)} · ${l.rating_count} review${l.rating_count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </h3>
            {reviews.length ? (
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {reviews.map((r) => (
                  <article key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{r.reviewer_name ?? "Captain"}</p>
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        <Star className="h-3 w-3 fill-foreground" /> {r.rating}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Be the first captain to tie up here and leave a review.
              </p>
            )}
          </section>

          {l.lat != null && l.lng != null && (
            <section className="mt-10 border-t border-border pt-8">
              <h3 className="text-xl font-bold">Where you'll tie up</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Exact coordinates are shared after your booking is confirmed.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`Map of ${locationLine(l)}`}
                  loading="lazy"
                  className="h-[320px] w-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${l.lng - 0.06}%2C${l.lat - 0.04}%2C${l.lng + 0.06}%2C${l.lat + 0.04}&layer=mapnik&marker=${l.lat}%2C${l.lng}`}
                />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {isShortTerm ? (
            <BookingPanel listing={l} start={start} end={end} onDates={(s, e) => { setStart(s); setEnd(e); }} />
          ) : (
            <div className="rounded-2xl border border-border p-6 shadow-card">
              <p className="text-lg font-bold">This listing isn't available for nightly booking.</p>
              <Link
                to="/listings/$id"
                params={{ id: l.id }}
                className="mt-4 inline-block text-sm font-semibold text-primary underline"
              >
                View full listing details →
              </Link>
            </div>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Every request is reviewed by the dock owner. Never pay outside DockFront messages.
          </p>
        </aside>
      </div>

      <SimilarDocks listing={l} />
    </div>
  );
}

function SimilarDocks({ listing }: { listing: Listing }) {
  const city = listing.city ?? undefined;
  const { data } = useQuery({
    queryKey: ["similar", listing.id, city ?? listing.country],
    queryFn: () =>
      searchShortTermSlips({
        data: { where: city ?? listing.country ?? undefined, limit: 8 } as never,
      }),
    staleTime: 60_000,
  });
  const others = (data ?? []).filter((d) => d.id !== listing.id).slice(0, 4);
  if (!others.length) return null;
  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-xl font-bold">More docks near {locationLine(listing) || "here"}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((d) => (
          <DockCard key={d.id} l={d} compact />
        ))}
      </div>
      <Link
        to="/rent"
        search={{ where: city } as never}
        className="mt-6 inline-block rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
      >
        See all docks in {city ?? "this area"}
      </Link>
    </section>
  );
}


function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

type Listing = NonNullable<Awaited<ReturnType<typeof getPublicListing>>>["listing"];

function BookingPanel({
  listing,
  start,
  end,
  onDates,
}: {
  listing: Listing;
  start: string;
  end: string;
  onDates: (start: string, end: string) => void;
}) {
  const navigate = useNavigate();
  const setStart = (v: string) => onDates(v, end && v && end <= v ? "" : end);
  const setEnd = (v: string) => onDates(start, v);
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
      navigate({ to: "/bookings/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border p-6 shadow-card">
      <p className="text-[22px] font-extrabold">
        {formatPrice(nightly)}
        <span className="text-base font-normal text-muted-foreground"> night</span>
      </p>

      <div className="overflow-hidden rounded-xl border border-input">
        <div className="grid grid-cols-2">
          <label className="border-r border-input p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Arrive
            <input
              required
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-foreground outline-none"
            />
          </label>
          <label className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Depart
            <input
              required
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={start || new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-foreground outline-none"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-input p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your boat</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            placeholder="Boat name"
            value={boatName}
            onChange={(e) => setBoatName(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm">
            <Users className="h-3.5 w-3.5" />
            <input
              type="number"
              min={1}
              max={listing.max_guests ?? 20}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value || 1))}
              className="w-full bg-transparent outline-none"
            />
          </label>
          <input
            placeholder="Length ft"
            type="number"
            min={0}
            value={boatLength}
            onChange={(e) => setBoatLength(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          />
          <input
            placeholder="Beam ft"
            type="number"
            min={0}
            step={0.5}
            value={boatBeam}
            onChange={(e) => setBoatBeam(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          />
          <input
            placeholder="Draft ft"
            type="number"
            min={0}
            step={0.5}
            value={boatDraft}
            onChange={(e) => setBoatDraft(e.target.value)}
            className="col-span-2 h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          />
        </div>
        {!boatOK && <p className="mt-2 text-xs text-destructive">Your boat exceeds this dock's limits.</p>}
      </div>

      <textarea
        rows={3}
        placeholder="Message to host (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        className="w-full rounded-xl border border-input bg-transparent p-3 text-sm"
      />

      <button
        disabled={busy || !boatOK || nights < 1 || nights < listing.min_nights}
        className="w-full rounded-xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "Sending…" : listing.instant_book ? "Book now" : "Request to book"}
      </button>
      {nights > 0 && nights < listing.min_nights && (
        <p className="text-center text-xs text-destructive">
          This dock has a {listing.min_nights}-night minimum.
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">You won't be charged yet</p>


      {nights > 0 && (
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          <Row label={`${formatPrice(nightly)} × ${nights} night${nights === 1 ? "" : "s"}`} value={formatPrice(subtotal)} />
          {cleaning > 0 && <Row label="Cleaning fee" value={formatPrice(cleaning)} />}
          <Row label={<b>Total</b>} value={<b>{formatPrice(total)}</b>} />
        </div>
      )}
    </form>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground underline decoration-dotted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
