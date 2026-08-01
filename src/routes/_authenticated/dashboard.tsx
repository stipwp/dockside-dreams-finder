import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyListings, deleteListing, setListingStatus } from "@/lib/listings.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Host dashboard — DockFront" },
      { name: "description", content: "Manage your DockFront dock listings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchListings = useServerFn(listMyListings);
  const fetchOverview = useServerFn(getAccountOverview);
  const { data, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: () => fetchListings() });
  const { data: overview } = useQuery({ queryKey: ["account-overview"], queryFn: () => fetchOverview() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-listings"] });
    qc.invalidateQueries({ queryKey: ["account-overview"] });
  };

  const del = useMutation({
    mutationFn: (id: string) => deleteListing({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing removed.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const status = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" | "sold_rented" }) =>
      setListingStatus({ data: v }),
    onSuccess: (r) => {
      toast.success(r.status === "published" ? "Listing is live." : "Listing unpublished.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your docks</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
              <Link to="/bookings" className="hover:text-foreground">
                Booking requests{overview?.pendingRequests ? ` (${overview.pendingRequests})` : ""}
              </Link>
              <Link to="/trips" className="hover:text-foreground">Your trips</Link>
              <Link to="/account" className="hover:text-foreground">Account</Link>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/listings/new" })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New listing
          </button>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading your listings…</p>}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-14 text-center">
            <p className="text-xl font-bold">No listings yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              List a slip for nightly bookings, a long-term lease, or a waterfront home.
            </p>
            <button
              onClick={() => navigate({ to: "/listings/new" })}
              className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Create listing
            </button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="mt-8 space-y-3">
            {data.map((l) => (
              <div key={l.id} className="rounded-2xl border border-border p-4">
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {l.cover_photo_url && (
                      <img src={l.cover_photo_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        l.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {l.status}
                    </span>
                    <p className="mt-1 truncate text-lg font-bold">{l.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[l.city, l.state].filter(Boolean).join(", ")} ·{" "}
                      {formatPrice(l.price_cents, l.price_period)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      status.mutate({
                        id: l.id,
                        status: l.status === "published" ? "draft" : "published",
                      })
                    }
                    disabled={status.isPending}
                    className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
                  >
                    {l.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <Link
                    to="/listings/$id/edit"
                    params={{ id: l.id }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <Link
                    to="/rent/$id"
                    params={{ id: l.id }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </Link>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/rent/${l.id}`);
                      toast.success("Listing link copied.");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
                  >
                    <Link2 className="h-4 w-4" /> Copy link
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this listing? This cannot be undone.")) del.mutate(l.id);
                    }}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
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
