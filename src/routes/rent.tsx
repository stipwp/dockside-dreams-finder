import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClientMap } from "@/components/client-map";
import { searchShortTermSlips } from "@/lib/bookings.functions";
import { rentSearchSchema, toServerRent, distanceMiles, type RentSearch } from "@/lib/rent-filters";
import { formatPrice, locationLine } from "@/lib/format";
import { Anchor, Ruler, Waves, Zap, Zap as Bolt, Search, LayoutGrid, Map as MapIcon, Columns2, Crosshair, X } from "lucide-react";

export const Route = createFileRoute("/rent")({
  validateSearch: (s) => rentSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Rent a Dock by the Night — DockFront" },
      { name: "description", content: "Find short-term dock rentals that fit your boat: length, beam, draft, waterway, and dates. Browse on an interactive map." },
      { property: "og:title", content: "Rent a dock — DockFront" },
      { property: "og:description", content: "Short-term dock rentals for boat owners." },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(qo(deps)),
  component: RentPage,
});

function qo(s: RentSearch) {
  return queryOptions({
    queryKey: ["rent", s],
    queryFn: () => searchShortTermSlips({ data: toServerRent(s) as never }),
  });
}

function RentPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/rent" });
  const [form, setForm] = useState<RentSearch>(search);
  const view = search.view ?? "grid";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: { ...form, view } as never });
  }

  function setView(v: "grid" | "map" | "split") {
    navigate({ search: { ...search, view: v } as never });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border bg-nav text-nav-foreground">
        <div className="mx-auto max-w-[100rem] px-4 py-8 md:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teak">Short-term dock rentals</p>
          <h1 className="mt-1 font-serif text-3xl md:text-4xl">Rent a dock, anywhere.</h1>

          <form onSubmit={submit} className="mt-6 grid gap-2 rounded-sm bg-background/95 p-3 text-foreground md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Where — city, marina, waterway…" value={form.where ?? ""} onChange={(e) => setForm({ ...form, where: e.target.value })} className="h-11 w-full rounded-sm border border-input bg-transparent pl-9 pr-3 text-sm" />
            </div>
            <input type="date" value={form.start ?? ""} onChange={(e) => setForm({ ...form, start: e.target.value || undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <input type="date" value={form.end ?? ""} onChange={(e) => setForm({ ...form, end: e.target.value || undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <input type="number" min={0} placeholder="Boat length (ft)" value={form.boat_length ?? ""} onChange={(e) => setForm({ ...form, boat_length: e.target.value ? Number(e.target.value) : undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <button className="h-11 rounded-sm bg-teak px-6 text-xs font-semibold uppercase tracking-widest text-teak-foreground">Search</button>
          </form>

          <div className="mt-3 grid gap-2 md:grid-cols-6">
            <input type="number" min={0} step={0.5} placeholder="Boat beam (ft)" value={form.boat_beam ?? ""} onChange={(e) => setForm({ ...form, boat_beam: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <input type="number" min={0} step={0.5} placeholder="Draft (ft)" value={form.boat_draft ?? ""} onChange={(e) => setForm({ ...form, boat_draft: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <input type="number" min={1} placeholder="Guests aboard" value={form.guests ?? ""} onChange={(e) => setForm({ ...form, guests: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <input placeholder="Waterway (e.g. Chesapeake)" value={form.waterway ?? ""} onChange={(e) => setForm({ ...form, waterway: e.target.value })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <select
              value={form.radius_mi ?? ""}
              onChange={(e) => setForm({ ...form, radius_mi: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground"
            >
              <option value="">Any distance</option>
              <option value="5">Within 5 mi</option>
              <option value="10">Within 10 mi</option>
              <option value="25">Within 25 mi</option>
              <option value="50">Within 50 mi</option>
              <option value="100">Within 100 mi</option>
              <option value="250">Within 250 mi</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-sm bg-background/90 px-3 text-xs text-foreground">
              <input type="checkbox" checked={!!form.instant} onChange={(e) => setForm({ ...form, instant: e.target.checked || undefined })} className="accent-teak" />
              Instant book only
            </label>
          </div>
          {search.near_lat != null && search.near_lng != null && search.radius_mi ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-sm bg-teak/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-teak-foreground ring-1 ring-teak/40">
              <Crosshair className="h-3 w-3" /> Anchored at {search.near_lat.toFixed(3)}, {search.near_lng.toFixed(3)} — {search.radius_mi} mi
              <button
                onClick={() => navigate({ search: { ...search, near_lat: undefined, near_lng: undefined } as never })}
                className="ml-1 opacity-70 hover:opacity-100"
                aria-label="Clear anchor"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-[100rem] px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Suspense fallback={<p className="text-xs uppercase tracking-widest text-muted-foreground">Searching…</p>}>
            <ResultsCount search={search} />
          </Suspense>
          <div className="inline-flex overflow-hidden rounded-sm border border-border">
            <ViewBtn active={view === "grid"} onClick={() => setView("grid")} icon={<LayoutGrid className="h-3.5 w-3.5" />}>Grid</ViewBtn>
            <ViewBtn active={view === "split"} onClick={() => setView("split")} icon={<Columns2 className="h-3.5 w-3.5" />}>Split</ViewBtn>
            <ViewBtn active={view === "map"} onClick={() => setView("map")} icon={<MapIcon className="h-3.5 w-3.5" />}>Map</ViewBtn>
          </div>
        </div>
        <Suspense fallback={<Skel />}>
          <Results search={search} view={view} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

function ViewBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition ${active ? "bg-nav text-nav-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function useFiltered(search: RentSearch) {
  const { data } = useSuspenseQuery(qo(search));
  return useMemo(() => {
    if (search.radius_mi && search.near_lat != null && search.near_lng != null) {
      return data.filter((l) => l.lat != null && l.lng != null && distanceMiles(search.near_lat!, search.near_lng!, l.lat, l.lng) <= search.radius_mi!);
    }
    return data;
  }, [data, search.radius_mi, search.near_lat, search.near_lng]);
}

function ResultsCount({ search }: { search: RentSearch }) {
  const data = useFiltered(search);
  return <p className="text-xs uppercase tracking-widest text-muted-foreground">{data.length} dock{data.length === 1 ? "" : "s"} available</p>;
}

function Results({ search, view }: { search: RentSearch; view: "grid" | "map" | "split" }) {
  const data = useFiltered(search);
  const navigate = useNavigate({ from: "/rent" });

  const mapListings = useMemo(
    () =>
      data
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({
          id: l.id,
          kind: "slip" as const,
          title: l.title,
          price_cents: l.nightly_price_cents ?? 0,
          price_period: "night",
          city: l.city,
          state: l.state,
          lat: l.lat as number,
          lng: l.lng as number,
          cover_photo_url: l.cover_photo_url,
        })),
    [data],
  );

  if (!data.length) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/40 p-16 text-center">
        <p className="font-serif text-2xl">No docks match your search.</p>
        <p className="mt-2 text-sm text-muted-foreground">Try widening dates, boat dimensions, or distance.</p>
      </div>
    );
  }

  const grid = (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.map((l) => <DockCard key={l.id} l={l} />)}
    </div>
  );

  const map = (
    <div className="relative h-[calc(100vh-16rem)] min-h-[560px] overflow-hidden border border-border">
      <ClientMap listings={mapListings} />
      {mapListings.length > 0 && (
        <button
          onClick={() => {
            // Use the centroid of visible pins as anchor
            const cx = mapListings.reduce((a, m) => a + m.lat, 0) / mapListings.length;
            const cy = mapListings.reduce((a, m) => a + m.lng, 0) / mapListings.length;
            navigate({ search: { ...search, near_lat: +cx.toFixed(5), near_lng: +cy.toFixed(5), radius_mi: search.radius_mi ?? 25 } as never });
          }}
          className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-sm bg-nav px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-nav-foreground shadow-lg hover:bg-teak"
        >
          <Crosshair className="h-3.5 w-3.5" /> Anchor here
        </button>
      )}
    </div>
  );

  if (view === "map") return map;
  if (view === "split") {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="max-h-[calc(100vh-16rem)] min-h-[560px] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((l) => <DockCard key={l.id} l={l} compact />)}
          </div>
        </div>
        <div className="sticky top-4 h-[calc(100vh-16rem)] min-h-[560px]">{map}</div>
      </div>
    );
  }
  return grid;
}

type DockRow = Awaited<ReturnType<typeof searchShortTermSlips>>[number];

function DockCard({ l, compact }: { l: DockRow; compact?: boolean }) {
  return (
    <Link to="/rent/$id" params={{ id: l.id }} className="group block overflow-hidden border border-border bg-card transition-shadow hover:shadow-lg">
      <div className={`${compact ? "aspect-[3/2]" : "aspect-[4/3]"} overflow-hidden bg-muted`}>
        {l.cover_photo_url ? (
          <img src={l.cover_photo_url} alt={l.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><Anchor className="h-10 w-10" strokeWidth={1} /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">{locationLine(l)}</p>
          {l.instant_book && <span className="rounded-sm bg-teak/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-teak"><Bolt className="mr-0.5 inline h-3 w-3" />Instant</span>}
        </div>
        <h3 className="mt-1 truncate font-serif text-xl">{l.title}</h3>
        <p className="mt-2 font-serif text-2xl text-teak">{formatPrice(l.nightly_price_cents ?? 0)}<span className="text-sm text-muted-foreground">/night</span></p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {l.max_boat_length_ft && <span><Ruler className="mr-1 inline h-3 w-3" />Up to {l.max_boat_length_ft}′</span>}
          {l.water_depth_ft && <span><Waves className="mr-1 inline h-3 w-3" />{l.water_depth_ft}′ depth</span>}
          {l.power && <span><Zap className="mr-1 inline h-3 w-3" />{l.power}</span>}
        </div>
      </div>
    </Link>
  );
}

function Skel() {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse bg-muted" />)}</div>;
}
