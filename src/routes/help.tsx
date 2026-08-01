import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre — booking and hosting docks — DockFront" },
      {
        name: "description",
        content: "Answers on booking a dock, hosting your slip, boat-fit rules, cancellations and safety on DockFront.",
      },
      { property: "og:title", content: "DockFront help centre" },
      { property: "og:description", content: "Booking, hosting, boat-fit, cancellations and safety answers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/help" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/help" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Help,
});

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How does booking a dock work?",
    a: "Search by destination and dates, enter your boat's length, beam and draft, and we only show docks that fit. Send a request — or book instantly on docks with Instant book — and the host confirms.",
  },
  {
    q: "When do I pay?",
    a: "DockFront does not take card payments yet. You confirm the dates and rate here, then settle directly with the dock owner on arrival. Never send money outside DockFront messages before a booking is confirmed.",
  },
  {
    q: "What if my boat doesn't fit?",
    a: "Every listing publishes max LOA, max beam and controlling depth at mean low water. If your numbers exceed the dock's limits the booking form blocks the request so nobody wastes a trip.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Cancel from Your trips at any time before arrival; the host is notified immediately. Each listing shows its own cancellation policy.",
  },
  {
    q: "How do I list my dock?",
    a: "Create an account, open List your dock, add photos, dock dimensions and your nightly rate. Publishing is free and your dock appears in worldwide search right away.",
  },
  {
    q: "Which locations are supported?",
    a: "DockFront is worldwide. Hosts are live across the US, Guatemala's Río Dulce, the Bahamas, Croatia, Panama and Thailand, and anyone with a private dock anywhere can list.",
  },
];

function Help() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Help centre</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Everything about booking a dock and hosting your slip.
        </p>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none text-lg font-bold">{f.q}</summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Contact support
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
