import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyHostBookings, respondToBooking } from "@/lib/bookings.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [{ title: "Bookings on your docks — DockFront" }, { name: "robots", content: "noindex" }],
  }),
  component: HostBookings,
});

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  pending: "bg-muted text-foreground",
};

function HostBookings() {
  const qc = useQueryClient();
  const fetchBookings = useServerFn(listMyHostBookings);
  const { data, isLoading } = useQuery({ queryKey: ["host-bookings"], queryFn: () => fetchBookings() });
  const respond = useMutation({
    mutationFn: (v: { id: string; action: "accept" | "decline" }) => respondToBooking({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.action === "accept" ? "Booking confirmed." : "Request declined.");
      qc.invalidateQueries({ queryKey: ["host-bookings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const pending = (data ?? []).filter((b) => b.status === "pending");
  const rest = (data ?? []).filter((b) => b.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Booking requests</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">Manage docks</Link>
          <Link to="/trips" className="hover:text-foreground">Your trips</Link>
          <Link to="/account" className="hover:text-foreground">Account</Link>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading requests…</p>}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-14 text-center">
            <p className="text-xl font-bold">No requests yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish a short-term dock listing and guests can request dates.
            </p>
            <Link
              to="/listings/new"
              className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              List your dock
            </Link>
          </div>
        )}

        {pending.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">Needs your response</h2>
            <div className="mt-4 space-y-3">
              {pending.map((b) => (
                <Row key={b.id} b={b} onRespond={(action) => respond.mutate({ id: b.id, action })} busy={respond.isPending} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">All bookings</h2>
            <div className="mt-4 space-y-3">
              {rest.map((b) => (
                <Row key={b.id} b={b} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type HostBooking = {
  id: string;
  start_date: string;
  end_date: string;
  nights: number;
  guests: number;
  total_cents: number;
  status: string;
  boat_name: string | null;
  boat_length_ft: number | null;
  message: string | null;
  listings: { title: string | null; cover_photo_url: string | null } | null;
};

function Row({
  b,
  onRespond,
  busy,
}: {
  b: HostBooking;
  onRespond?: (action: "accept" | "decline") => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex gap-4">
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
            {b.start_date} → {b.end_date} · {b.nights}n · {b.guests} guest{b.guests === 1 ? "" : "s"} ·{" "}
            {formatPrice(b.total_cents)}
          </p>
          {b.boat_name && (
            <p className="text-sm text-muted-foreground">
              Boat: {b.boat_name}
              {b.boat_length_ft ? ` · ${b.boat_length_ft} ft` : ""}
            </p>
          )}
          {b.message && <p className="mt-2 text-sm">“{b.message}”</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRespond && (
          <>
            <button
              onClick={() => onRespond("accept")}
              disabled={busy}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={() => onRespond("decline")}
              disabled={busy}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}
        <Link
          to="/bookings/$id"
          params={{ id: b.id }}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
        >
          Details & messages
        </Link>
      </div>
    </div>
  );
}
