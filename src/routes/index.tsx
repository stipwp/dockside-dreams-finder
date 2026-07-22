import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { listPublicListings } from "@/lib/listings.functions";
import heroImg from "@/assets/hero-dock.jpg";
import floridaImg from "@/assets/region-florida.jpg";
import chesapeakeImg from "@/assets/region-chesapeake.jpg";
import pnwImg from "@/assets/region-pnw.jpg";
import lakesImg from "@/assets/region-lakes.jpg";
import { Search } from "lucide-react";

const featuredQO = queryOptions({
  queryKey: ["listings", "featured"],
  queryFn: () => listPublicListings({ data: { limit: 6 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DockFront — Waterfront Homes & Boat Slips FSBO" },
      {
        name: "description",
        content:
          "Find your next waterfront home or dock slip, listed directly by owners. Private FSBO marketplace for boat owners across the U.S.",
      },
      { property: "og:title", content: "DockFront — FSBO Waterfront & Dock Slips" },
      {
        property: "og:description",
        content: "Waterfront homes with private docks and boat slips, listed by owners.",
      },
      { property: "og:url", content: "https://boatanddock.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://boatanddock.lovable.app/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQO),
  component: HomePage,
});

const REGIONS = [
  { name: "Florida Intracoastal", count: "Coming soon", img: floridaImg },
  { name: "Chesapeake Bay", count: "Coming soon", img: chesapeakeImg },
  { name: "Pacific Northwest", count: "Coming soon", img: pnwImg },
  { name: "Great Lakes", count: "Coming soon", img: lakesImg },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav transparent />
      <Hero />
      <FeaturedSection />
      <RegionsSection />
      <HowItWorksStrip />
      <ListCTASection />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [advanced, setAdvanced] = useState(false);
  const [kind, setKind] = useState<"any" | "home" | "slip">("any");
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minDockLen, setMinDockLen] = useState("");
  const [minBoatLen, setMinBoatLen] = useState("");
  const [minDepth, setMinDepth] = useState("");
  const [power, setPower] = useState("");
  const [covered, setCovered] = useState(false);
  const [floating, setFloating] = useState(false);
  const [liveaboard, setLiveaboard] = useState(false);

  function buildSearch() {
    const s: Record<string, unknown> = {};
    if (kind !== "any") s.kind = kind;
    if (q) s.q = q;
    if (state) s.state = state;
    if (minPrice) s.minPrice = Number(minPrice);
    if (maxPrice) s.maxPrice = Number(maxPrice);
    if (minDockLen) s.minDockLen = Number(minDockLen);
    if (minBoatLen) s.minBoatLen = Number(minBoatLen);
    if (minDepth) s.minDepth = Number(minDepth);
    if (power) s.power = power;
    if (covered) s.covered = true;
    if (floating) s.floating = true;
    if (liveaboard) s.liveaboard_allowed = true;
    return s;
  }

  function goList(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/listings", search: buildSearch() as never });
  }
  function goMap() {
    navigate({ to: "/map", search: buildSearch() as never });
  }

  return (
    <section className="relative min-h-[92vh] w-full overflow-hidden">
      <img
        src={heroImg}
        alt="Private waterfront dock at dusk"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-nav/50 via-nav/35 to-nav/80" />

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-4 pt-24 pb-16 text-center text-nav-foreground">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-teak">
          For sale by owner · waterfront homes & dock slips
        </p>
        <div className="hairline-frame px-6 py-6 md:px-14 md:py-10">
          <h1 className="font-serif text-5xl leading-[0.95] md:text-7xl lg:text-8xl">
            LIVE ON
            <br />
            THE WATER
          </h1>
        </div>
        <p className="mt-6 max-w-xl text-sm text-nav-foreground/85 md:text-base">
          Find your next waterfront home or dock slip. Listed direct by owners, for boat owners.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={goMap}
            className="rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground transition-colors hover:bg-teak/90"
          >
            Search on map
          </button>
          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="rounded-sm border border-nav-foreground/60 bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-nav-foreground transition-colors hover:bg-nav-foreground/10"
          >
            {advanced ? "Hide advanced" : "Advanced search"}
          </button>
        </div>

        <form
          onSubmit={goList}
          className="mt-6 w-full max-w-5xl rounded-sm bg-background/95 p-4 text-left text-foreground shadow-2xl backdrop-blur"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_1fr_10rem_auto]">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "any" | "home" | "slip")}
              className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm"
            >
              <option value="any">All property types</option>
              <option value="home">Waterfront homes</option>
              <option value="slip">Dock slips</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="City, waterway, marina, keyword…"
                className="h-11 w-full rounded-sm border border-input bg-transparent pl-9 pr-3 text-sm"
              />
            </div>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="h-11 rounded-sm border border-input bg-transparent px-3 text-sm"
            />
            <button
              type="submit"
              className="h-11 rounded-sm bg-nav px-6 text-xs font-semibold uppercase tracking-[0.16em] text-nav-foreground transition-colors hover:bg-nav/90"
            >
              Search
            </button>
          </div>

          {advanced && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <FieldMini label="Min price">
                  <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={hInput} placeholder="0" />
                </FieldMini>
                <FieldMini label="Max price">
                  <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={hInput} placeholder="any" />
                </FieldMini>
                <FieldMini label="Min dock (ft)">
                  <input type="number" min={0} value={minDockLen} onChange={(e) => setMinDockLen(e.target.value)} className={hInput} />
                </FieldMini>
                <FieldMini label="Max boat (ft)">
                  <input type="number" min={0} value={minBoatLen} onChange={(e) => setMinBoatLen(e.target.value)} className={hInput} />
                </FieldMini>
                <FieldMini label="Min depth (ft)">
                  <input type="number" min={0} step={0.5} value={minDepth} onChange={(e) => setMinDepth(e.target.value)} className={hInput} />
                </FieldMini>
                <FieldMini label="Shore power">
                  <select value={power} onChange={(e) => setPower(e.target.value)} className={hInput}>
                    <option value="">Any</option>
                    <option value="30A">30 amp</option>
                    <option value="50A">50 amp</option>
                    <option value="100A">100 amp</option>
                  </select>
                </FieldMini>
                <FieldMini label=" ">
                  <label className="flex h-11 items-center gap-2 rounded-sm border border-input px-3 text-xs">
                    <input type="checkbox" checked={covered} onChange={(e) => setCovered(e.target.checked)} className="accent-teak" />
                    Covered slip
                  </label>
                </FieldMini>
                <FieldMini label=" ">
                  <label className="flex h-11 items-center gap-2 rounded-sm border border-input px-3 text-xs">
                    <input type="checkbox" checked={floating} onChange={(e) => setFloating(e.target.checked)} className="accent-teak" />
                    Floating dock
                  </label>
                </FieldMini>
                <FieldMini label=" ">
                  <label className="flex h-11 items-center gap-2 rounded-sm border border-input px-3 text-xs">
                    <input type="checkbox" checked={liveaboard} onChange={(e) => setLiveaboard(e.target.checked)} className="accent-teak" />
                    Liveaboard OK
                  </label>
                </FieldMini>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center gap-6 text-xs uppercase tracking-widest text-nav-foreground/70">
          <Link to="/listings" className="hover:text-teak">Browse all listings →</Link>
          <Link to="/list-your-property" className="hover:text-teak">List your property →</Link>
        </div>
      </div>
    </section>
  );
}

const hInput = "h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm";

function FieldMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FeaturedSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="mb-12 flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teak">
            Handpicked
          </p>
          <h2 className="font-serif text-4xl md:text-5xl">Featured listings</h2>
        </div>
        <Link
          to="/listings"
          className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-teak md:block"
        >
          View all →
        </Link>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <FeaturedGrid />
      </Suspense>
    </section>
  );
}

function FeaturedGrid() {
  const { data } = useSuspenseQuery(featuredQO);
  if (!data.length) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/40 p-16 text-center">
        <p className="font-serif text-2xl text-foreground">No listings yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to list a waterfront home or dock slip.
        </p>
        <Link
          to="/list-your-property"
          className="mt-6 inline-block rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
        >
          List your property
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((l) => (
        <ListingCard key={l.id} l={l} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse bg-muted" />
      ))}
    </div>
  );
}

function RegionsSection() {
  return (
    <section className="bg-nav py-24 text-nav-foreground">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-12 border-b border-white/10 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teak">
            Search by region
          </p>
          <h2 className="font-serif text-4xl md:text-5xl">
            Some of the best cruising waters in the country
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REGIONS.map((r) => (
            <Link
              key={r.name}
              to="/listings"
              className="group relative block aspect-[4/5] overflow-hidden"
            >
              <img
                src={r.img}
                alt={r.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-nav via-nav/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-serif text-2xl text-nav-foreground">{r.name}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-teak">
                  {r.count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksStrip() {
  const steps = [
    { n: "01", t: "Post your listing", d: "Photos, price, dock specs — takes about 5 minutes." },
    { n: "02", t: "Talk directly to buyers", d: "Every inquiry goes straight to your inbox." },
    { n: "03", t: "Close on your terms", d: "No agents, no commissions, no middlemen." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="mb-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teak">
          How it works
        </p>
        <h2 className="font-serif text-4xl md:text-5xl">FSBO. The way it should be.</h2>
      </div>
      <div className="grid gap-10 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="border-t border-teak pt-6">
            <p className="font-serif text-5xl text-teak">{s.n}</p>
            <h3 className="mt-4 font-serif text-2xl">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ListCTASection() {
  return (
    <section
      className="relative overflow-hidden bg-cover bg-center py-24"
      style={{ backgroundImage: `linear-gradient(rgba(11,31,51,0.85), rgba(11,31,51,0.85)), url(${heroImg})` }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center text-nav-foreground md:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-teak">
          Own the dock. Own the sale.
        </p>
        <h2 className="font-serif text-4xl md:text-6xl">
          List your waterfront property today.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-nav-foreground/80">
          Free to post. Talk directly to boat owners looking for their next slip or
          waterfront home.
        </p>
        <Link
          to="/list-your-property"
          className="mt-10 inline-block rounded-sm bg-teak px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground transition-colors hover:bg-teak/90"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}
