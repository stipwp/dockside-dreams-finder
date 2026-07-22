import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How DockFront works — FSBO waterfront listings" },
      {
        name: "description",
        content: "How to list your waterfront home or dock slip on DockFront — free, direct-to-buyer, no commissions.",
      },
      { property: "og:title", content: "How it works — DockFront" },
      { property: "og:description", content: "FSBO waterfront listings the way they should be." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const steps = [
    { n: "01", t: "Create your account", d: "Sign up in seconds with email or Google." },
    { n: "02", t: "Post your property", d: "Photos, price, dock specs. Save a draft or publish immediately." },
    { n: "03", t: "Get direct inquiries", d: "Every message from a prospective buyer goes straight to you." },
    { n: "04", t: "Close on your terms", d: "You keep 100% of the sale. No agents, no commissions." },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-24 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">How it works</p>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl">FSBO. Made simple.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          DockFront is a purpose-built marketplace for waterfront homes with docks and
          private dock slips. We do one thing well: connect boat owners directly with
          owners selling or renting waterfront property.
        </p>
        <div className="mt-16 space-y-10">
          {steps.map((s) => (
            <div key={s.n} className="grid gap-4 border-t border-border pt-8 md:grid-cols-[120px_1fr]">
              <p className="font-serif text-5xl text-teak">{s.n}</p>
              <div>
                <h3 className="font-serif text-2xl">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <Link
            to="/list-your-property"
            className="rounded-sm bg-teak px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
          >
            List your property
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
