import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  adminAuditLog,
  adminListListings,
  adminListReports,
  adminListUsers,
  adminListVerifications,
  adminResolveReport,
  adminReviewVerification,
  adminSetFeatured,
  adminSetListingStatus,
  adminSetSuspension,
  amIAdmin,
  getAdminOverview,
} from "@/lib/admin.functions";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — DockFront" },
      { name: "description", content: "Moderate listings, resolve reports, and review host verifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "reports" | "listings" | "verifications" | "users" | "audit";

function AdminPage() {
  const checkAdmin = useServerFn(amIAdmin);
  const { data: gate, isLoading } = useQuery({ queryKey: ["am-i-admin"], queryFn: () => checkAdmin() });
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-6xl px-4 py-20 text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  if (!gate?.admin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-extrabold">Admin only</h1>
          <p className="mt-2 text-muted-foreground">
            This console is limited to DockFront administrators.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background">
            Back to DockFront
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "reports", label: "Reports" },
    { id: "listings", label: "Listings" },
    { id: "verifications", label: "Verifications" },
    { id: "users", label: "Users" },
    { id: "audit", label: "Audit log" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin console</h1>
        <p className="mt-1 text-muted-foreground">Moderation, verification, and platform health.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors ${
                tab === t.id
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "overview" && <Overview />}
          {tab === "reports" && <Reports />}
          {tab === "listings" && <Listings />}
          {tab === "verifications" && <Verifications />}
          {tab === "users" && <Users />}
          {tab === "audit" && <Audit />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="text-3xl font-extrabold">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Overview() {
  const fn = useServerFn(getAdminOverview);
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Card label="Open reports" value={data?.openReports} />
      <Card label="Pending verifications" value={data?.pendingVerifications} />
      <Card label="Published listings" value={data?.publishedListings} />
      <Card label="Draft listings" value={data?.draftListings} />
      <Card label="Bookings" value={data?.bookings} />
      <Card label="Members" value={data?.users} />
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border p-5">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{children}</p>;
}

function Reports() {
  const qc = useQueryClient();
  const list = useServerFn(adminListReports);
  const resolve = useServerFn(adminResolveReport);
  const { data } = useQuery({ queryKey: ["admin-reports"], queryFn: () => list() });
  const act = useMutation({
    mutationFn: (v: { id: string; status: "reviewing" | "resolved" | "dismissed" }) => resolve({ data: v }),
    onSuccess: () => {
      toast.success("Report updated.");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!data?.length) return <Empty>No reports yet. Good sign.</Empty>;

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Row key={r.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold">
                {r.reason}{" "}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                  {r.target_type}
                </span>
              </p>
              {r.details && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{r.details}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()} · target {r.target_id.slice(0, 8)} · status {r.status}
              </p>
            </div>
            {r.status === "open" || r.status === "reviewing" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => act.mutate({ id: r.id, status: "resolved" })}
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background"
                >
                  Resolve
                </button>
                <button
                  onClick={() => act.mutate({ id: r.id, status: "dismissed" })}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        </Row>
      ))}
    </div>
  );
}

function Listings() {
  const qc = useQueryClient();
  const list = useServerFn(adminListListings);
  const setStatus = useServerFn(adminSetListingStatus);
  const setFeatured = useServerFn(adminSetFeatured);
  const [filter, setFilter] = useState("all");
  const { data } = useQuery({ queryKey: ["admin-listings", filter], queryFn: () => list({ data: { status: filter } }) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };
  const status = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" | "sold_rented" }) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Listing updated."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const feature = useMutation({
    mutationFn: (v: { id: string; featured: boolean }) => setFeatured({ data: v }),
    onSuccess: () => { toast.success("Featured updated."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["all", "published", "draft", "sold_rented"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              filter === s ? "bg-foreground text-background" : "border border-border"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      {!data?.length ? (
        <Empty>No listings in this state.</Empty>
      ) : (
        data.map((l) => (
          <Row key={l.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">
                  {l.title}
                  {l.is_demo && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">demo</span>}
                  {l.featured && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">featured</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[l.city, l.country].filter(Boolean).join(", ")} · {l.status} · {l.listing_type}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => status.mutate({ id: l.id, status: l.status === "published" ? "draft" : "published" })}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                >
                  {l.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => feature.mutate({ id: l.id, featured: !l.featured })}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                >
                  {l.featured ? "Unfeature" : "Feature"}
                </button>
              </div>
            </div>
          </Row>
        ))
      )}
    </div>
  );
}

function Verifications() {
  const qc = useQueryClient();
  const list = useServerFn(adminListVerifications);
  const review = useServerFn(adminReviewVerification);
  const { data } = useQuery({ queryKey: ["admin-verifications"], queryFn: () => list() });
  const act = useMutation({
    mutationFn: (v: { id: string; decision: "verified" | "rejected" }) => review({ data: v }),
    onSuccess: () => {
      toast.success("Verification reviewed.");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!data?.length) return <Empty>Nobody has submitted verification yet.</Empty>;

  return (
    <div className="space-y-3">
      {data.map((v) => (
        <Row key={v.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">Member {v.user_id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">
                Identity: {v.identity_status} · email {v.email_verified ? "confirmed" : "unconfirmed"} · phone{" "}
                {v.phone_verified ? "confirmed" : "unconfirmed"}
              </p>
            </div>
            {v.identity_status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => act.mutate({ id: v.id, decision: "verified" })}
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background"
                >
                  Approve
                </button>
                <button
                  onClick={() => act.mutate({ id: v.id, decision: "rejected" })}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </Row>
      ))}
    </div>
  );
}

function Users() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const suspend = useServerFn(adminSetSuspension);
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const act = useMutation({
    mutationFn: (v: { user_id: string; suspended: boolean }) => suspend({ data: v }),
    onSuccess: () => {
      toast.success("Member updated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!data?.length) return <Empty>No members yet.</Empty>;

  return (
    <div className="space-y-3">
      {data.map((u) => (
        <Row key={u.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{u.full_name || `Member ${u.id.slice(0, 8)}`}</p>
              <p className="text-sm text-muted-foreground">
                Joined {new Date(u.created_at).toLocaleDateString()}
                {u.suspended_at ? ` · suspended (${u.suspension_reason ?? "no reason"})` : ""}
              </p>
            </div>
            <button
              onClick={() => act.mutate({ user_id: u.id, suspended: !u.suspended_at })}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              {u.suspended_at ? "Reinstate" : "Suspend"}
            </button>
          </div>
        </Row>
      ))}
    </div>
  );
}

function Audit() {
  const list = useServerFn(adminAuditLog);
  const { data } = useQuery({ queryKey: ["admin-audit"], queryFn: () => list() });
  if (!data?.length) return <Empty>No admin actions recorded yet.</Empty>;
  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div key={a.id} className="rounded-xl border border-border px-4 py-3 text-sm">
          <span className="font-bold">{a.action}</span>{" "}
          <span className="text-muted-foreground">
            {a.target_type} {a.target_id?.slice(0, 8)} · {new Date(a.created_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
