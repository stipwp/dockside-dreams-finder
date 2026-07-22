import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listMyListings, deleteListing } from "@/lib/listings.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — DockFront" },
      { name: "description", content: "Manage your DockFront listings." },
      { property: "og:title", content: "Owner dashboard — DockFront" },
      { property: "og:description", content: "Your listings and inquiries." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listMyListings(),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteListing({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing removed.");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">
              Owner dashboard
            </p>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl">Your listings</h1>
          </div>
          <button
            onClick={() => navigate({ to: "/listings/new" })}
            className="inline-flex items-center gap-2 rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground hover:bg-teak/90"
          >
            <Plus className="h-4 w-4" /> New listing
          </button>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}

        {data && data.length === 0 && (
          <div className="mt-12 rounded-sm border border-dashed border-border p-16 text-center">
            <p className="font-serif text-2xl">No listings yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first waterfront home or dock slip listing.
            </p>
            <button
              onClick={() => navigate({ to: "/listings/new" })}
              className="mt-6 rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
            >
              Create listing
            </button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="mt-10 divide-y divide-border overflow-hidden bg-card ring-1 ring-border">
            {data.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-20 w-28 flex-shrink-0 overflow-hidden bg-muted">
                  {l.cover_photo_url && (
                    <img src={l.cover_photo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest " +
                        (l.status === "published"
                          ? "bg-teak text-teak-foreground"
                          : l.status === "draft"
                            ? "bg-muted text-muted-foreground"
                            : "bg-nav text-nav-foreground")
                      }
                    >
                      {l.status}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {l.kind === "home" ? "Home" : "Slip"}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-serif text-xl">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[l.city, l.state].filter(Boolean).join(", ")} · {formatPrice(l.price_cents, l.price_period)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {l.status === "published" && (
                    <Link
                      to="/listings/$id"
                      params={{ id: l.id }}
                      className="rounded-sm p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    to="/listings/$id/edit"
                    params={{ id: l.id }}
                    className="rounded-sm p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Delete this listing?")) del.mutate(l.id);
                    }}
                    className="rounded-sm p-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
