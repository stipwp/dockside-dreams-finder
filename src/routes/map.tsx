import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map search — DockFront" },
      { name: "description", content: "Search waterfront properties and dock slips on the map." },
      { property: "og:title", content: "Map search — DockFront" },
      { property: "og:description", content: "Waterfront properties, mapped." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-32 text-center md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">Map search</p>
        <h1 className="mt-2 font-serif text-5xl">Coming soon</h1>
        <p className="mt-6 text-muted-foreground">
          We're wiring up the interactive map view. In the meantime, use the browse view.
        </p>
        <Link
          to="/listings"
          className="mt-10 inline-block rounded-sm bg-teak px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
        >
          Browse listings
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
