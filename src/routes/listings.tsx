import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { FilterPanel } from "@/components/filter-panel";
import { ClientMap } from "@/components/client-map";
import { listPublicListings, listMapListings } from "@/lib/listings.functions";
import { listingSearchSchema, toServerFilters, activeFilterCount, type ListingSearch } from "@/lib/listing-filters";
import { Grid3x3, MapIcon, SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/listings")({
  validateSearch: (s) => listingSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Browse Waterfront Homes & Dock Slips — DockFront" },
      { name: "description", content: "Filter waterfront homes and boat slips by dock length, water depth, max boat length, shore power, and more." },
      { property: "og:title", content: "Browse listings — DockFront" },
      { property: "og:description", content: "Waterfront properties for sale by owner." },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(browseQO(deps)),
  component: BrowsePage,
});

function browseQO(s: ListingSearch) {
  return queryOptions({
    queryKey: ["listings", "browse", s],
    queryFn: () => listPublicListings({ data: toServerFilters(s) }),
  });
}

function mapQO(s: ListingSearch) {
  return queryOptions({
    queryKey: ["listings", "map", s],
    queryFn: () => listMapListings({ data: toServerFilters(s) }),
  });
}

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/listings" });
  const [sheet, setSheet] = useState(false);
  const view = search.view ?? "grid";
  const count = activeFilterCount(search);

  function apply(next: ListingSearch) {
    navigate({ search: { ...next, view: search.view, q: search.q } as never });
    setSheet(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <SubHeader search={search} count={count} view={view} onView={(v) => navigate({ search: { ...search, view: v } as never })} onOpenFilters={() => setSheet(true)} />

      <div className="mx-auto flex max-w-[100rem] gap-6 px-4 py-8 md:px-8">
        <FilterPanel value={search} onApply={apply} />

        <main className="min-w-0 flex-1">
          <Suspense fallback={<Skeleton />}>
            {view === "map" ? <MapView search={search} /> : <Results search={search} />}
          </Suspense>
        </main>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="flex-1 bg-black/50" aria-label="Close" onClick={() => setSheet(false)} />
          <div className="w-[86%] max-w-sm">
            <FilterPanel variant="sheet" value={search} onApply={apply} onClose={() => setSheet(false)} />
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function SubHeader({
  search, count, view, onView, onOpenFilters,
}: {
  search: ListingSearch;
  count: number;
  view: "grid" | "map";
  onView: (v: "grid" | "map") => void;
  onOpenFilters: () => void;
}) {
  const navigate = useNavigate({ from: "/listings" });
  const [q, setQ] = useState(search.q ?? "");
  return (
    <div className="border-b border-border bg-nav text-nav-foreground">
      <div className="mx-auto max-w-[100rem] px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teak">Search results</p>
            <h1 className="mt-1 font-serif text-3xl md:text-4xl">
              {search.kind === "home" ? "Waterfront homes" : search.kind === "slip" ? "Dock slips" : "All waterfront properties"}
            </h1>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: { ...search, q: q || undefined } as never });
            }}
            className="flex items-center gap-2 rounded-sm bg-background/95 p-1.5 text-foreground shadow"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="City, waterway, keyword…"
              className="h-9 w-56 rounded-sm bg-transparent px-3 text-sm outline-none md:w-72"
            />
            {search.q && (
              <button
                type="button"
                onClick={() => { setQ(""); navigate({ search: { ...search, q: undefined } as never }); }}
                className="text-muted-foreground hover:text-nav"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button className="h-9 rounded-sm bg-teak px-4 text-[10px] font-semibold uppercase tracking-widest text-teak-foreground">
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={onOpenFilters}
            className="flex items-center gap-2 rounded-sm bg-background/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ring-1 ring-white/20 hover:bg-background/20 lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters {count > 0 && <span className="rounded-full bg-teak px-1.5 text-teak-foreground">{count}</span>}
          </button>
          <div className="ml-auto inline-flex overflow-hidden rounded-sm ring-1 ring-white/20">
            <ViewBtn active={view === "grid"} onClick={() => onView("grid")} icon={<Grid3x3 className="h-3.5 w-3.5" />} label="Grid" />
            <ViewBtn active={view === "map"} onClick={() => onView("map")} icon={<MapIcon className="h-3.5 w-3.5" />} label="Map" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors " +
        (active ? "bg-teak text-teak-foreground" : "bg-transparent text-nav-foreground/80 hover:bg-white/10")
      }
    >
      {icon} {label}
    </button>
  );
}

function Results({ search }: { search: ListingSearch }) {
  const { data } = useSuspenseQuery(browseQO(search));
  if (!data.length) return <EmptyState />;
  return (
    <>
      <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">{data.length} propert{data.length === 1 ? "y" : "ies"} found</p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((l) => <ListingCard key={l.id} l={l} />)}
      </div>
    </>
  );
}

function MapView({ search }: { search: ListingSearch }) {
  const { data } = useSuspenseQuery(mapQO(search));
  return (
    <div className="flex flex-col">
      <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        {data.length} mapped propert{data.length === 1 ? "y" : "ies"}
        {data.length === 0 && " — try widening filters"}
      </p>
      <div className="h-[calc(100vh-16rem)] min-h-[500px] overflow-hidden border border-border">
        <ClientMap listings={data} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-sm border border-dashed border-border bg-muted/40 p-16 text-center">
      <p className="font-serif text-2xl">No listings match those filters.</p>
      <p className="mt-2 text-sm text-muted-foreground">Try widening your price range or dock specs.</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse bg-muted" />
      ))}
    </div>
  );
}
