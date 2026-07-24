import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { searchShortTermSlips } from "@/lib/bookings.functions";
import { rentSearchSchema, toServerRent, type RentSearch } from "@/lib/rent-filters";
import { formatPrice, locationLine } from "@/lib/format";
import { Anchor, Ruler, Waves, Zap, Zap as Bolt, Search } from "lucide-react";

export const Route = createFileRoute("/rent")({
  validateSearch: (s) => rentSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Rent a Dock by the Night — DockFront" },
      { name: "description", content: "Find short-term dock rentals that fit your boat: length, beam, draft, shore power, and dates." },
      { property: "og:title", content: "Rent a dock — DockFront" },
      { property: "og:description", content: "Short-term dock rentals for boat owners." },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(qo(deps)),
  component: RentPage,
});

function qo(s: RentSearch) {
  return queryOptions({
    queryKey: ["rent", s],
    queryFn: () => searchShortTermSlips({ data: toServerRent(s) as never }),
  });
}

function RentPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/rent" });
  const [form, setForm] = useState<RentSearch>(search);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: form as never });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border bg-nav text-nav-foreground">
        <div className="mx-auto max-w-[100rem] px-4 py-8 md:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teak">Short-term dock rentals</p>
          <h1 className="mt-1 font-serif text-3xl md:text-4xl">Rent a dock, anywhere.</h1>

          <form onSubmit={submit} className="mt-6 grid gap-2 rounded-sm bg-background/95 p-3 text-foreground md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Where — city, marina, waterway…" value={form.where ?? ""} onChange={(e) => setForm({ ...form, where: e.target.value })} className="h-11 w-full rounded-sm border border-input bg-transparent pl-9 pr-3 text-sm" />
            </div>
            <input type="date" value={form.start ?? ""} onChange={(e) => setForm({ ...form, start: e.target.value || undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <input type="date" value={form.end ?? ""} onChange={(e) => setForm({ ...form, end: e.target.value || undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <input type="number" min={0} placeholder="Boat length (ft)" value={form.boat_length ?? ""} onChange={(e) => setForm({ ...form, boat_length: e.target.value ? Number(e.target.value) : undefined })} className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm" />
            <button className="h-11 rounded-sm bg-teak px-6 text-xs font-semibold uppercase tracking-widest text-teak-foreground">Search</button>
          </form>

          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input type="number" min={0} step={0.5} placeholder="Boat beam (ft)" value={form.boat_beam ?? ""} onChange={(e) => setForm({ ...form, boat_beam: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <input type="number" min={0} step={0.5} placeholder="Draft (ft)" value={form.boat_draft ?? ""} onChange={(e) => setForm({ ...form, boat_draft: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <input type="number" min={1} placeholder="Guests aboard" value={form.guests ?? ""} onChange={(e) => setForm({ ...form, guests: e.target.value ? Number(e.target.value) : undefined })} className="h-10 rounded-sm bg-background/90 px-3 text-xs text-foreground" />
            <label className="flex h-10 items-center gap-2 rounded-sm bg-background/90 px-3 text-xs text-foreground">
              <input type="checkbox" checked={!!form.instant} onChange={(e) => setForm({ ...form, instant: e.target.checked || undefined })} className="accent-teak" />
              Instant book only
            </label>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[100rem] px-4 py-10 md:px-8">
        <Suspense fallback={<Skel />}>
          <Results search={search} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

function Results({ search }: { search: RentSearch }) {
  const { data } = useSuspenseQuery(qo(search));
  if (!data.length) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/40 p-16 text-center">
        <p className="font-serif text-2xl">No docks match your search.</p>
        <p className="mt-2 text-sm text-muted-foreground">Try widening dates or boat dimensions.</p>
      </div>
    );
  }
  return (
    <>
      <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">{data.length} dock{data.length === 1 ? "" : "s"} available</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((l) => (
          <Link key={l.id} to="/rent/$id" params={{ id: l.id }} className="group block overflow-hidden border border-border bg-card transition-shadow hover:shadow-lg">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {l.cover_photo_url ? (
                <img src={l.cover_photo_url} alt={l.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground"><Anchor className="h-10 w-10" strokeWidth={1} /></div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">{locationLine(l)}</p>
                {l.instant_book && <span className="rounded-sm bg-teak/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-teak"><Bolt className="mr-0.5 inline h-3 w-3" />Instant</span>}
              </div>
              <h3 className="mt-1 truncate font-serif text-xl">{l.title}</h3>
              <p className="mt-2 font-serif text-2xl text-teak">{formatPrice(l.nightly_price_cents ?? 0)}<span className="text-sm text-muted-foreground">/night</span></p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {l.max_boat_length_ft && <span><Ruler className="mr-1 inline h-3 w-3" />Up to {l.max_boat_length_ft}′</span>}
                {l.water_depth_ft && <span><Waves className="mr-1 inline h-3 w-3" />{l.water_depth_ft}′ depth</span>}
                {l.power && <span><Zap className="mr-1 inline h-3 w-3" />{l.power}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Skel() {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse bg-muted" />)}</div>;
}
