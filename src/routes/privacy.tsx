import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — DockFront" },
      { name: "description", content: "What DockFront collects, how listing and booking data is used, and how to request deletion." },
      { property: "og:title", content: "Privacy policy — DockFront" },
      { property: "og:description", content: "What we collect, how we use it, and your choices." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is maintained by the DockFront team to explain how the product handles your data.
        </p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">What we collect</h2>
            <p className="mt-2">
              Account details you provide (name, email, optional phone), listing content you publish, booking details
              including vessel dimensions and dates, messages exchanged with the other party, and standard technical
              logs needed to run the service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">How we use it</h2>
            <p className="mt-2">
              To show listings, match boats to docks that fit, deliver booking requests and messages, secure accounts,
              and improve search. We do not sell your personal data.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">What other people can see</h2>
            <p className="mt-2">
              Published listing content is public. Your contact details are not shown on public listing pages — they are
              shared with the other party once a booking or inquiry connects you. Reviews display the reviewer's first
              name only.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">Access controls</h2>
            <p className="mt-2">
              Accounts are authenticated, and database access rules restrict every record to the users entitled to it —
              guests and hosts see only their own bookings and messages. Draft listings and their photos stay private
              until you publish.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">Retention and deletion</h2>
            <p className="mt-2">
              We keep account and booking records while your account is active. To request export or deletion of your
              data,{" "}
              <Link to="/contact" className="font-semibold text-primary underline">
                contact us
              </Link>{" "}
              from the email on your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground">Cookies</h2>
            <p className="mt-2">
              We use cookies and local storage strictly to keep you signed in and remember search preferences.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
