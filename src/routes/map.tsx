import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { FilterPanel } from "@/components/filter-panel";
import { ClientMap } from "@/components/client-map";
import { listMapListings } from "@/lib/listings.functions";
import { listingSearchSchema, toServerFilters, activeFilterCount, type ListingSearch } from "@/lib/listing-filters";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/map")({
  validateSearch: (s) => listingSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Map Search — Waterfront Homes & Slips — DockFront" },
      { name: "description", content: "Explore FSBO waterfront homes with private docks and boat slips on an interactive map." },
      { property: "og:title", content: "Map search — DockFront" },
      { property: "og:description", content: "Waterfront properties, mapped." },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(mapQO(deps)),
  component: MapPage,
});

function mapQO(s: ListingSearch) {
  return queryOptions({
    queryKey: ["listings", "map", "page", s],
    queryFn: () => listMapListings({ data: toServerFilters(s) }),
  });
}

function MapPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/map" });
  const [sheet, setSheet] = useState(false);
  const count = activeFilterCount(search);

  function apply(next: ListingSearch) {
    navigate({ search: next as never });
    setSheet(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      <div className="border-b border-border bg-nav px-4 py-4 text-nav-foreground md:px-8">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teak">Interactive map</p>
            <h1 className="mt-0.5 font-serif text-2xl md:text-3xl">Waterfront properties</h1>
          </div>
          <button
            onClick={() => setSheet(true)}
            className="flex items-center gap-2 rounded-sm bg-background/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ring-1 ring-white/20 hover:bg-background/20 lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters {count > 0 && <span className="rounded-full bg-teak px-1.5 text-teak-foreground">{count}</span>}
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[100rem] flex-1 gap-4 px-4 py-4 md:px-8">
        <FilterPanel value={search} onApply={apply} />
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
            <MapBody search={search} />
          </Suspense>
        </div>
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

function MapBody({ search }: { search: ListingSearch }) {
  const { data } = useSuspenseQuery(mapQO(search));
  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        {data.length} mapped propert{data.length === 1 ? "y" : "ies"}
        {data.length === 0 && " — add lat/lng to your listing to appear here"}
      </p>
      <div className="h-[calc(100vh-18rem)] min-h-[520px] overflow-hidden border border-border">
        <ClientMap listings={data} />
      </div>
    </div>
  );
}
