import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About DockFront — Built for boat owners" },
      { name: "description", content: "DockFront is a private FSBO marketplace built by boat owners, for boat owners." },
      { property: "og:title", content: "About — DockFront" },
      { property: "og:description", content: "Built by boat owners, for boat owners." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-24 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">About</p>
        <h1 className="mt-2 font-serif text-5xl">Built by boat owners, for boat owners.</h1>
        <div className="prose prose-neutral mt-10 max-w-none space-y-4 text-lg text-foreground">
          <p>
            Finding a home with the right dock — or a slip that fits your boat — shouldn't
            require a maze of listing agents and generic real-estate portals. DockFront is a
            focused marketplace built around one specific thing: waterfront properties with
            usable docks, and the boat owners who need them.
          </p>
          <p>
            Every listing is posted directly by the owner. Every inquiry goes straight to
            them. No brokers, no commissions, no lead-selling. Just direct conversations
            between the people who care most about the water.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
