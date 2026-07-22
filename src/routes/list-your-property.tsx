import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero-dock.jpg";
import { Check } from "lucide-react";

export const Route = createFileRoute("/list-your-property")({
  head: () => ({
    meta: [
      { title: "List Your Waterfront Property — Free FSBO on DockFront" },
      {
        name: "description",
        content: "List your waterfront home or dock slip on DockFront. Free to post. Direct-to-buyer. No commissions.",
      },
      { property: "og:title", content: "List your property — DockFront" },
      { property: "og:description", content: "Free FSBO listings for waterfront homes and dock slips." },
    ],
  }),
  component: ListYourProperty,
});

function ListYourProperty() {
  const benefits = [
    "Reach buyers actively looking for waterfront properties with dockage",
    "Full control over pricing, photos, and dock specs",
    "Direct inquiries — no brokers, no lead-selling",
    "Free to post your first listing",
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section
        className="relative bg-cover bg-center py-32 text-nav-foreground"
        style={{ backgroundImage: `linear-gradient(rgba(11,31,51,0.7), rgba(11,31,51,0.7)), url(${heroImg})` }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teak">List your property</p>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl">Sell direct. Rent direct.</h1>
          <p className="mx-auto mt-6 max-w-xl text-nav-foreground/85">
            Post your waterfront home or dock slip in minutes. Your listing goes live for
            boat owners searching DockFront.
          </p>
          <Link
            to="/auth"
            className="mt-10 inline-block rounded-sm bg-teak px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground hover:bg-teak/90"
          >
            Get started free
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-24 md:px-8">
        <h2 className="font-serif text-4xl md:text-5xl">Why DockFront</h2>
        <ul className="mt-10 space-y-4">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 border-b border-border pb-4">
              <Check className="mt-1 h-5 w-5 flex-shrink-0 text-teak" />
              <span className="text-lg text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </section>
      <SiteFooter />
    </div>
  );
}
