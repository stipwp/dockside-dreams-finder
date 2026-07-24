import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyHostBookings, respondToBooking, cancelBooking } from "@/lib/bookings.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "Bookings on your docks — DockFront" }, { name: "robots", content: "noindex" }] }),
  component: HostBookings,
});

function HostBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["host-bookings"], queryFn: () => listMyHostBookings() });
  const respond = useMutation({
    mutationFn: (v: { id: string; action: "accept" | "decline" }) => respondToBooking({ data: v }),
    onSuccess: () => { toast.success("Updated."); qc.invalidateQueries({ queryKey: ["host-bookings"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelBooking({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host-bookings"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">Host</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Booking requests</h1>
        <div className="mt-4 flex gap-4 text-xs uppercase tracking-widest">
          <Link to="/dashboard" className="text-muted-foreground hover:text-teak">Owner dashboard</Link>
          <Link to="/trips" className="text-muted-foreground hover:text-teak">Your trips</Link>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <div className="mt-12 rounded-sm border border-dashed border-border p-16 text-center">
            <p className="font-serif text-2xl">No booking requests yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Set one of your listings to short-term to accept bookings.</p>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="mt-10 space-y-3">
            {data.map((b) => (
              <div key={b.id} className="grid gap-3 border border-border p-4 md:grid-cols-[7rem_1fr_auto] md:items-center">
                <div className="h-20 w-28 overflow-hidden bg-muted">
                  {b.listings?.cover_photo_url && <img src={b.listings.cover_photo_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <span className={"inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest " + statusClass(b.status)}>{b.status}</span>
                  <p className="mt-1 font-serif text-lg">{b.listings?.title}</p>
                  <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · {b.nights}n · {b.guests} guest{b.guests === 1 ? "" : "s"} · {formatPrice(b.total_cents)}</p>
                  {b.boat_name && <p className="text-xs text-muted-foreground">Boat: {b.boat_name} {b.boat_length_ft ? `· ${b.boat_length_ft}′` : ""}</p>}
                  {b.message && <p className="mt-1 text-sm italic text-muted-foreground">"{b.message}"</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => respond.mutate({ id: b.id, action: "accept" })} className="rounded-sm bg-teak px-4 py-2 text-xs font-semibold uppercase tracking-widest text-teak-foreground">Accept</button>
                      <button onClick={() => respond.mutate({ id: b.id, action: "decline" })} className="rounded-sm bg-muted px-4 py-2 text-xs uppercase tracking-widest ring-1 ring-border">Decline</button>
                    </>
                  )}
                  {b.status === "accepted" && (
                    <button onClick={() => { if (confirm("Cancel this booking?")) cancel.mutate(b.id); }} className="rounded-sm bg-muted px-4 py-2 text-xs uppercase tracking-widest ring-1 ring-border">Cancel</button>
                  )}
                </div>
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
  return "bg-muted text-muted-foreground";
}
