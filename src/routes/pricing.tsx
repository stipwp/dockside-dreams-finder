import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Check, Zap, Star, Anchor } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing for dock hosts & captains — DockFront" },
      {
        name: "description",
        content:
          "List your dock free, or upgrade to Host Pro for unlimited listings, instant book and featured placement. Captain membership for frequent boaters.",
      },
      { property: "og:title", content: "DockFront pricing — host plans & Captain membership" },
      { property: "og:description", content: "Free listings, Host Pro for unlimited docks and featured placement, Captain perks for boaters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    note: "for every dock owner",
    icon: <Anchor className="h-5 w-5" />,
    features: ["1 published dock", "Request-to-book bookings", "Guest messaging", "Worldwide search visibility"],
    cta: "List your dock",
    to: "/list-your-property" as const,
  },
  {
    name: "Host Pro",
    price: "$29",
    note: "per month",
    icon: <Zap className="h-5 w-5" />,
    highlight: true,
    features: [
      "Unlimited published docks",
      "Instant book",
      "Featured placement credits",
      "Saved-search alerts to matching captains",
      "Priority support",
    ],
    cta: "Start Host Pro",
    to: "/dashboard" as const,
  },
  {
    name: "Captain",
    price: "$9",
    note: "per month, for boaters",
    icon: <Star className="h-5 w-5" />,
    features: ["Saved-search alerts", "Early access to new docks", "Trip planning wishlist folders", "Member support line"],
    cta: "Join as Captain",
    to: "/rent" as const,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[72rem] px-4 py-16 md:px-8">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Simple pricing for docks and the boats that need them
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Listing is free. Upgrade only when you want more reach, instant bookings, or alerts the moment a dock opens up
          where you're heading.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-7 ${p.highlight ? "border-primary shadow-card" : "border-border"}`}
            >
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {p.icon} {p.name}
              </div>
              <p className="mt-4 text-4xl font-extrabold">{p.price}</p>
              <p className="text-sm text-muted-foreground">{p.note}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.to}
                className={`mt-7 rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                  p.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-muted"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Paid plans are rolling out — hosts on the free plan keep every booking they receive today. Questions?{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Talk to us
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
