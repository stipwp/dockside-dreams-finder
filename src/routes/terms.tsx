import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — DockFront" },
      { name: "description", content: "The rules for using DockFront as a captain booking docks or a host listing them." },
      { property: "og:title", content: "Terms of service — DockFront" },
      { property: "og:description", content: "The rules for using DockFront as a captain or a dock host." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {new Date().getFullYear()}</p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. What DockFront is</h2>
            <p className="mt-2">
              DockFront is a marketplace that connects boat owners with private dock and slip owners. DockFront is not a
              marina operator, broker, or party to any agreement between a host and a guest.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">2. Accounts</h2>
            <p className="mt-2">
              You must be able to enter a binding contract to use DockFront. Keep your credentials secure and provide
              accurate information about yourself, your vessel, and your dock.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">3. Bookings and payment</h2>
            <p className="mt-2">
              A booking is a direct agreement between the guest and the host. DockFront does not currently process
              payments; rates shown are the amounts agreed between the parties and settled directly. Never send funds
              outside a confirmed booking.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">4. Host responsibilities</h2>
            <p className="mt-2">
              Hosts must accurately describe dock dimensions, controlling depth, utilities and access, hold the rights
              needed to offer the dock, and comply with local rules, permits and taxes.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">5. Guest responsibilities</h2>
            <p className="mt-2">
              Guests are responsible for their vessel, its insurance, safe handling, and any damage caused to the dock
              or surrounding property.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">6. Prohibited use</h2>
            <p className="mt-2">
              No fraudulent listings, harassment, scraping, or use of DockFront for unlawful activity. We may suspend
              accounts that break these terms.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">7. Liability</h2>
            <p className="mt-2">
              DockFront is provided as-is. To the extent permitted by law, DockFront is not liable for losses arising
              from a stay, a dock's condition, or a user's conduct.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">8. Changes</h2>
            <p className="mt-2">
              We may update these terms as the product evolves. Continued use after an update means you accept the
              revised terms.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
