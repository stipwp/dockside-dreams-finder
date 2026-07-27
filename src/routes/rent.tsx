import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClientMap } from "@/components/client-map";
import { DockCard } from "@/components/dock-card";
import { searchShortTermSlips } from "@/lib/bookings.functions";
import { rentSearchSchema, toServerRent, distanceMiles, type RentSearch } from "@/lib/rent-filters";
import { Search, LayoutGrid, Map as MapIcon, Columns2, Crosshair, X, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/rent")({
  validateSearch: (s) => rentSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Find a dock worldwide — DockFront" },
      { name: "description", content: "Search private docks and slips by night anywhere in the world. Filter by dates, waterway, distance and your boat's length, beam and draft." },
      { property: "og:title", content: "Find a dock worldwide — DockFront" },
      { property: "og:description", content: "Short-term dock rentals for boat owners, from Guatemala to Croatia." },
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
  const [showFilters, setShowFilters] = useState(false);
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

      <section className="sticky top-20 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-[100rem] px-4 py-3 md:px-8">
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Where to? City, country, marina or waterway"
                value={form.where ?? ""}
                onChange={(e) => setForm({ ...form, where: e.target.value })}
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm shadow-sm outline-none focus:border-foreground"
              />
            </div>
            <input type="date" aria-label="Arrive" value={form.start ?? ""} onChange={(e) => setForm({ ...form, start: e.target.value || undefined })} className="h-12 rounded-full border border-border px-4 text-sm" />
            <input type="date" aria-label="Depart" value={form.end ?? ""} onChange={(e) => setForm({ ...form, end: e.target.value || undefined })} className="h-12 rounded-full border border-border px-4 text-sm" />
            <input type="number" min={0} placeholder="Boat length ft" value={form.boat_length ?? ""} onChange={(e) => setForm({ ...form, boat_length: e.target.value ? Number(e.target.value) : undefined })} className="h-12 w-36 rounded-full border border-border px-4 text-sm" />
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <button className="h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Search
            </button>
          </form>

          {showFilters && (
            <div className="mt-3 grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-3 lg:grid-cols-6">
              <input type="number" min={0} step={0.5} placeholder="Beam (ft)" value={form.boat_beam ?? ""} onChange={(e) => setForm({ ...form, boat_beam: e.target.value ? Number(e.target.value) : undefined })} className="h-11 rounded-xl border border-border px-3 text-sm" />
              <input type="number" min={0} step={0.5} placeholder="Draft (ft)" value={form.boat_draft ?? ""} onChange={(e) => setForm({ ...form, boat_draft: e.target.value ? Number(e.target.value) : undefined })} className="h-11 rounded-xl border border-border px-3 text-sm" />
              <input type="number" min={1} placeholder="Guests aboard" value={form.guests ?? ""} onChange={(e) => setForm({ ...form, guests: e.target.value ? Number(e.target.value) : undefined })} className="h-11 rounded-xl border border-border px-3 text-sm" />
              <input placeholder="Waterway" value={form.waterway ?? ""} onChange={(e) => setForm({ ...form, waterway: e.target.value })} className="h-11 rounded-xl border border-border px-3 text-sm" />
              <select
                aria-label="Distance"
                value={form.radius_mi ?? ""}
                onChange={(e) => setForm({ ...form, radius_mi: e.target.value ? Number(e.target.value) : undefined })}
                className="h-11 rounded-xl border border-border px-3 text-sm"
              >
                <option value="">Any distance</option>
                {[5, 10, 25, 50, 100, 250].map((m) => <option key={m} value={m}>Within {m} mi</option>)}
              </select>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input type="checkbox" checked={!!form.instant} onChange={(e) => setForm({ ...form, instant: e.target.checked || undefined })} className="accent-primary" />
                Instant book
              </label>
            </div>
          )}

          {search.near_lat != null && search.near_lng != null && search.radius_mi ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">
              <Crosshair className="h-3.5 w-3.5 text-primary" /> Within {search.radius_mi} mi of map centre
              <button onClick={() => navigate({ search: { ...search, near_lat: undefined, near_lng: undefined } as never })} aria-label="Clear distance anchor" className="opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-[100rem] px-4 py-6 md:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Searching…</p>}>
            <ResultsCount search={search} />
          </Suspense>
          <div className="inline-flex overflow-hidden rounded-full border border-border">
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
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition ${active ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"}`}
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
  return (
    <p className="text-sm font-semibold">
      {data.length} dock{data.length === 1 ? "" : "s"} available
      {search.where ? ` in ${search.where}` : " worldwide"}
    </p>
  );
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
      <div className="rounded-2xl border border-dashed border-border p-16 text-center">
        <p className="text-xl font-bold">No docks match your search.</p>
        <p className="mt-2 text-sm text-muted-foreground">Try widening your dates, boat dimensions or distance.</p>
      </div>
    );
  }

  const grid = (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((l) => <DockCard key={l.id} l={l} />)}
    </div>
  );

  const map = (
    <div className="relative h-[calc(100vh-18rem)] min-h-[560px] overflow-hidden rounded-2xl border border-border">
      <ClientMap listings={mapListings} />
      {mapListings.length > 0 && (
        <button
          onClick={() => {
            const cx = mapListings.reduce((a, m) => a + m.lat, 0) / mapListings.length;
            const cy = mapListings.reduce((a, m) => a + m.lng, 0) / mapListings.length;
            navigate({ search: { ...search, near_lat: +cx.toFixed(5), near_lng: +cy.toFixed(5), radius_mi: search.radius_mi ?? 25 } as never });
          }}
          className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2.5 text-xs font-semibold shadow-card hover:bg-muted"
        >
          <Crosshair className="h-3.5 w-3.5 text-primary" /> Search this area
        </button>
      )}
    </div>
  );

  if (view === "map") return map;
  if (view === "split") {
    return (
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="max-h-[calc(100vh-18rem)] min-h-[560px] overflow-y-auto pr-1">
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
            {data.map((l) => <DockCard key={l.id} l={l} compact />)}
          </div>
        </div>
        <div className="sticky top-40 h-[calc(100vh-18rem)] min-h-[560px]">{map}</div>
      </div>
    );
  }
  return grid;
}

function Skel() {
  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}
