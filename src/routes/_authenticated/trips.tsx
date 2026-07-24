import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyTrips, cancelBooking } from "@/lib/bookings.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({ meta: [{ title: "Your trips — DockFront" }, { name: "robots", content: "noindex" }] }),
  component: Trips,
});

function Trips() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-trips"], queryFn: () => listMyTrips() });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelBooking({ data: { id } }),
    onSuccess: () => { toast.success("Cancelled."); qc.invalidateQueries({ queryKey: ["my-trips"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">Traveler</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Your trips</h1>
        <div className="mt-4 flex gap-4 text-xs uppercase tracking-widest">
          <Link to="/dashboard" className="text-muted-foreground hover:text-teak">Owner dashboard</Link>
          <Link to="/bookings" className="text-muted-foreground hover:text-teak">Host bookings</Link>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <div className="mt-12 rounded-sm border border-dashed border-border p-16 text-center">
            <p className="font-serif text-2xl">No trips yet.</p>
            <Link to="/rent" className="mt-6 inline-block rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-widest text-teak-foreground">Find a dock</Link>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="mt-10 divide-y divide-border ring-1 ring-border">
            {data.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-20 w-28 flex-shrink-0 overflow-hidden bg-muted">
                  {b.listings?.cover_photo_url && <img src={b.listings.cover_photo_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={"inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest " + statusClass(b.status)}>{b.status}</span>
                  <p className="mt-1 truncate font-serif text-lg">{b.listings?.title ?? "Listing"}</p>
                  <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · {b.nights} night{b.nights === 1 ? "" : "s"} · {formatPrice(b.total_cents)}</p>
                </div>
                {(b.status === "pending" || b.status === "accepted") && (
                  <button onClick={() => { if (confirm("Cancel this trip?")) cancel.mutate(b.id); }} className="rounded-sm bg-muted px-3 py-2 text-xs uppercase tracking-widest ring-1 ring-border hover:bg-destructive hover:text-destructive-foreground">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function statusClass(s: string) {
  if (s === "accepted") return "bg-teak text-teak-foreground";
  if (s === "pending") return "bg-nav text-nav-foreground";
  if (s === "cancelled" || s === "declined" || s === "expired") return "bg-muted text-muted-foreground";
  return "bg-muted";
}
