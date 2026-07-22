import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { listPublicListings } from "@/lib/listings.functions";

const searchSchema = z.object({
  kind: z.enum(["home", "slip"]).optional(),
  q: z.string().max(80).optional(),
});

export const Route = createFileRoute("/listings")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Browse Waterfront Homes & Dock Slips — DockFront" },
      {
        name: "description",
        content:
          "Browse waterfront homes with private docks and boat slips for rent, listed by owners across the country.",
      },
      { property: "og:title", content: "Browse listings — DockFront" },
      { property: "og:description", content: "Waterfront properties for sale by owner." },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(browseQO(deps)),
  component: BrowsePage,
});

function browseQO(deps: { kind?: "home" | "slip"; q?: string }) {
  return queryOptions({
    queryKey: ["listings", "browse", deps],
    queryFn: () =>
      listPublicListings({ data: { kind: deps.kind, query: deps.q, limit: 48 } }),
  });
}

function BrowsePage() {
  const search = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">
            Search results
          </p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">
            {search.kind === "home"
              ? "Waterfront homes"
              : search.kind === "slip"
                ? "Dock slips for rent"
                : "All properties"}
          </h1>
          <Filters />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
          <Results />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

function Filters() {
  const navigate = useNavigate({ from: "/listings" });
  const search = Route.useSearch();
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {[
        { label: "All", kind: undefined as "home" | "slip" | undefined },
        { label: "Homes with docks", kind: "home" as const },
        { label: "Dock slips", kind: "slip" as const },
      ].map((f) => {
        const active = search.kind === f.kind;
        return (
          <button
            key={f.label}
            onClick={() => navigate({ search: { ...search, kind: f.kind } })}
            className={
              "rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors " +
              (active
                ? "bg-nav text-nav-foreground"
                : "bg-background text-foreground ring-1 ring-border hover:bg-muted")
            }
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function Results() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(browseQO(search));
  if (!data.length) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/40 p-16 text-center">
        <p className="font-serif text-2xl">No listings match your search.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check back soon — new properties are added daily.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((l) => (
        <ListingCard key={l.id} l={l} />
      ))}
    </div>
  );
}
