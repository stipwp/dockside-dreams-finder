import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { DockCard } from "@/components/dock-card";
import { searchShortTermSlips } from "@/lib/bookings.functions";
import heroImg from "@/assets/hero-dock.jpg";
import rioImg from "@/assets/dest-riodulce.jpg";
import bahamasImg from "@/assets/dest-bahamas.jpg";
import croatiaImg from "@/assets/dest-croatia.jpg";
import thailandImg from "@/assets/dest-thailand.jpg";
import floridaImg from "@/assets/region-florida.jpg";
import { Search, MapPin, Anchor, Ship, Zap, Waves, Sailboat, Home, Building2 } from "lucide-react";

const TITLE = "DockFront — Rent a dock anywhere in the world";
const DESC =
  "Book private docks and slips by the night, from Río Dulce to the Bahamas, Croatia and Thailand. Search by dates and your boat's length, beam and draft.";

const docksQO = queryOptions({
  queryKey: ["home", "docks"],
  queryFn: () => searchShortTermSlips({ data: { limit: 8 } as never }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://boatanddock.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://boatanddock.lovable.app/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(docksQO),
  component: HomePage,
});

const CATEGORIES = [
  { label: "All docks", icon: Anchor, search: {} },
  { label: "Instant book", icon: Zap, search: { instant: true } },
  { label: "Deep water", icon: Waves, search: { boat_draft: 6 } },
  { label: "Big boats 60′+", icon: Ship, search: { boat_length: 60 } },
  { label: "Sailboat friendly", icon: Sailboat, search: { boat_draft: 5 } },
  { label: "Liveaboard", icon: Home, search: { guests: 2 } },
  { label: "Marinas", icon: Building2, search: { where: "marina" } },
] as const;

const DESTINATIONS = [
  { name: "Río Dulce", country: "Guatemala", img: rioImg, blurb: "Jungle river hurricane hole" },
  { name: "Nassau", country: "Bahamas", img: bahamasImg, blurb: "Turquoise island slips" },
  { name: "Split", country: "Croatia", img: croatiaImg, blurb: "Adriatic old-town moorings" },
  { name: "Phuket", country: "Thailand", img: thailandImg, blurb: "Andaman sea berths" },
  { name: "Miami", country: "United States", img: floridaImg, blurb: "Intracoastal home docks" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <Hero />
      <CategoryStrip />
      <main className="mx-auto max-w-[100rem] px-4 md:px-8">
        <Suspense fallback={<Skeleton />}>
          <DockGrid />
        </Suspense>
        <Destinations />
        <HowItWorks />
        <HostCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [where, setWhere] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [boat, setBoat] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s: Record<string, unknown> = {};
    if (where) s.where = where;
    if (start) s.start = start;
    if (end) s.end = end;
    if (boat) s.boat_length = Number(boat);
    navigate({ to: "/rent", search: s as never });
  }

  return (
    <section className="mx-auto max-w-[100rem] px-4 pt-6 md:px-8">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={heroImg}
          alt="Private dock at dusk with a boat moored alongside"
          width={1920}
          height={1280}
          className="h-[26rem] w-full object-cover md:h-[32rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-12">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-5xl">
            Rent a dock anywhere. Tie up tonight.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
            Private docks and slips by the night — Guatemala, the Bahamas, Croatia, Thailand and beyond.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="relative z-10 mx-auto -mt-8 grid max-w-5xl gap-1 rounded-2xl border border-border bg-background p-2 shadow-card md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:rounded-full md:p-1.5"
      >
        <Field label="Where">
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Search destinations"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field label="Arrive">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </Field>
        <Field label="Depart">
          <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </Field>
        <Field label="Your boat">
          <input
            type="number"
            min={0}
            value={boat}
            onChange={(e) => setBoat(e.target.value)}
            placeholder="Length in ft"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <button className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:mt-0">
          <Search className="h-4 w-4" strokeWidth={2.5} /> Search
        </button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="cursor-text rounded-xl px-5 py-2.5 transition-colors hover:bg-muted md:rounded-full">
      <span className="block text-[11px] font-bold uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function CategoryStrip() {
  const navigate = useNavigate();
  return (
    <div className="sticky top-20 z-20 mt-8 border-y border-border bg-background/95 backdrop-blur">
      <div className="no-scrollbar mx-auto flex max-w-[100rem] gap-8 overflow-x-auto px-4 py-3 md:px-8">
        {CATEGORIES.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate({ to: "/rent", search: c.search as never })}
            className="group flex shrink-0 flex-col items-center gap-1.5 border-b-2 border-transparent pb-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <c.icon className="h-5 w-5" strokeWidth={1.8} />
            <span className="whitespace-nowrap text-xs font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DockGrid() {
  const { data } = useSuspenseQuery(docksQO);
  return (
    <section className="pt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold md:text-2xl">Docks available now</h2>
        <Link to="/rent" className="text-sm font-semibold underline">Show all</Link>
      </div>
      {data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-14 text-center">
          <p className="text-lg font-semibold">No docks listed yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Be the first host on DockFront.</p>
          <Link to="/list-your-property" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            List your dock
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((l) => <DockCard key={l.id} l={l} />)}
        </div>
      )}
    </section>
  );
}

function Destinations() {
  return (
    <section className="pt-16">
      <h2 className="text-xl font-bold md:text-2xl">Explore waters worldwide</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cruising grounds where boaters are looking for a berth.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.name}
            to="/rent"
            search={{ where: d.name } as never}
            className="group overflow-hidden rounded-2xl"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-2xl">
              <img
                src={d.img}
                alt={`Docks in ${d.name}, ${d.country}`}
                loading="lazy"
                width={1024}
                height={768}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="pt-3">
              <p className="flex items-center gap-1.5 text-[15px] font-semibold">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {d.name}, {d.country}
              </p>
              <p className="text-sm text-muted-foreground">{d.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { t: "Tell us your boat", d: "Length, beam, draft and how many are aboard. We only show docks that actually fit." },
  { t: "Book or request", d: "Instant book where hosts allow it, or send a request with your arrival plan." },
  { t: "Tie up and enjoy", d: "Message your host, get gate codes and power details, and settle in." },
];

function HowItWorks() {
  return (
    <section className="pt-16">
      <h2 className="text-xl font-bold md:text-2xl">How DockFront works</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.t} className="rounded-2xl border border-border p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="mt-4 text-lg font-bold">{s.t}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HostCTA() {
  return (
    <section className="pt-16">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-foreground px-8 py-12 text-background">
        <div>
          <h2 className="text-2xl font-extrabold md:text-3xl">Your dock sits empty. Boaters need it.</h2>
          <p className="mt-2 max-w-xl text-sm opacity-80">
            List your private dock, slip or mooring in minutes. Set your nightly price, your dates and your boat-size limits.
          </p>
        </div>
        <Link
          to="/list-your-property"
          className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start hosting
        </Link>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-x-5 gap-y-8 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
