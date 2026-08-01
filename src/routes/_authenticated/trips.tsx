import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyTrips } from "@/lib/bookings.functions";
import { formatPrice } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({ meta: [{ title: "Your trips — DockFront" }, { name: "robots", content: "noindex" }] }),
  component: Trips,
});

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  pending: "bg-muted text-foreground",
};

function Trips() {
  const fetchTrips = useServerFn(listMyTrips);
  const { data, isLoading } = useQuery({ queryKey: ["my-trips"], queryFn: () => fetchTrips() });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (data ?? []).filter(
    (b) => b.end_date >= today && (b.status === "pending" || b.status === "accepted"),
  );
  const past = (data ?? []).filter((b) => !upcoming.includes(b));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Trips</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
          <Link to="/account" className="hover:text-foreground">Account</Link>
          <Link to="/bookings" className="hover:text-foreground">Booking requests</Link>
          <Link to="/reviews" className="hover:text-foreground">Reviews</Link>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading your trips…</p>}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-14 text-center">
            <p className="text-xl font-bold">No trips booked yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Time to find a slip for your next passage.</p>
            <Link
              to="/rent"
              className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Find a dock
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <Section title="Upcoming">
            {upcoming.map((b) => (
              <TripRow key={b.id} b={b} />
            ))}
          </Section>
        )}
        {past.length > 0 && (
          <Section title="Where you've been">
            {past.map((b) => (
              <TripRow key={b.id} b={b} />
            ))}
          </Section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

type Trip = {
  id: string;
  start_date: string;
  end_date: string;
  nights: number;
  total_cents: number;
  status: string;
  listings: { title: string | null; city: string | null; state: string | null; cover_photo_url: string | null } | null;
};

function TripRow({ b }: { b: Trip }) {
  return (
    <Link
      to="/bookings/$id"
      params={{ id: b.id }}
      className="flex items-center gap-4 rounded-2xl border border-border p-3 transition-shadow hover:shadow-card"
    >
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
        {b.listings?.cover_photo_url && (
          <img src={b.listings.cover_photo_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {b.status}
        </span>
        <p className="mt-1 truncate text-lg font-bold">{b.listings?.title ?? "Dock"}</p>
        <p className="text-sm text-muted-foreground">
          {[b.listings?.city, b.listings?.state].filter(Boolean).join(", ")} · {b.start_date} → {b.end_date} ·{" "}
          {b.nights} night{b.nights === 1 ? "" : "s"} · {formatPrice(b.total_cents)}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
