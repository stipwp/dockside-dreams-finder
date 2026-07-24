import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getPublicListing, sendInquiry } from "@/lib/listings.functions";
import { formatPrice, locationLine } from "@/lib/format";
import { Anchor, Bath, Bed, MapPin, Ruler, Waves, Zap } from "lucide-react";
import { toast } from "sonner";

const listingQO = (id: string) =>
  queryOptions({
    queryKey: ["listings", "one", id],
    queryFn: () => getPublicListing({ data: { id } }),
  });

export const Route = createFileRoute("/listings/$id")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(listingQO(params.id));
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Listing not found — DockFront" }, { name: "robots", content: "noindex" }] };
    }
    const l = loaderData.listing;
    const title = `${l.title} — ${formatPrice(l.price_cents, l.price_period)} — DockFront`;
    const desc = (l.description ?? "").slice(0, 155) || `${l.title} in ${locationLine(l)}`;
    const url = `https://boatanddock.lovable.app/listings/${params.id}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: l.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (l.cover_photo_url) {
      meta.push({ property: "og:image", content: l.cover_photo_url });
      meta.push({ name: "twitter:image", content: l.cover_photo_url });
    }
    const priceUnit =
      l.price_period === "month" ? "MONTH" : l.price_period === "season" ? "ANN" : undefined;
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      price: (l.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    };
    if (priceUnit) {
      offer.priceSpecification = {
        "@type": "UnitPriceSpecification",
        price: (l.price_cents / 100).toFixed(2),
        priceCurrency: "USD",
        unitCode: priceUnit,
      };
    }
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": l.kind === "home" ? "Product" : "Product",
      name: l.title,
      description: desc,
      offers: offer,
    };
    if (l.cover_photo_url) jsonLd.image = l.cover_photo_url;
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-serif text-5xl">Listing not found</h1>
        <p className="mt-4 text-muted-foreground">
          It may have been removed or is no longer published.
        </p>
        <Link to="/listings" className="mt-8 inline-block rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-widest text-teak-foreground">
          Browse other listings
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-serif text-3xl">Something went wrong.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const params = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <Suspense fallback={<div className="p-16 text-center text-muted-foreground">Loading…</div>}>
        <Body id={params.id} />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function Body({ id }: { id: string }) {
  const { data } = useSuspenseQuery(listingQO(id));
  if (!data) return null;
  const l = data.listing;
  const photos = data.photos.length
    ? data.photos
    : l.cover_photo_url
      ? [{ id: "cover", url: l.cover_photo_url, is_cover: true, sort_order: 0 }]
      : [];

  return (
    <div>
      <Gallery photos={photos} title={l.title} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teak">
            <MapPin className="h-3.5 w-3.5" /> {locationLine(l) || "Location on request"}
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">{l.title}</h1>
          <p className="mt-4 font-serif text-3xl text-teak">
            {formatPrice(l.price_cents, l.price_period)}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 md:grid-cols-4">
            {l.kind === "home" ? (
              <>
                <Stat icon={<Bed className="h-4 w-4" />} label="Bedrooms" value={l.bedrooms ?? "—"} />
                <Stat icon={<Bath className="h-4 w-4" />} label="Bathrooms" value={l.bathrooms ?? "—"} />
                <Stat icon={<Ruler className="h-4 w-4" />} label="Sq ft" value={l.sqft?.toLocaleString() ?? "—"} />
                <Stat icon={<Anchor className="h-4 w-4" />} label="Dock" value={l.dock_length_ft ? `${l.dock_length_ft}′` : "—"} />
              </>
            ) : (
              <>
                <Stat icon={<Ruler className="h-4 w-4" />} label="Dock length" value={l.dock_length_ft ? `${l.dock_length_ft}′` : "—"} />
                <Stat icon={<Anchor className="h-4 w-4" />} label="Max boat" value={l.max_boat_length_ft ? `${l.max_boat_length_ft}′` : "—"} />
                <Stat icon={<Waves className="h-4 w-4" />} label="Depth" value={l.water_depth_ft ? `${l.water_depth_ft}′` : "—"} />
                <Stat icon={<Zap className="h-4 w-4" />} label="Power" value={l.power ?? "—"} />
              </>
            )}
          </div>

          {l.description && (
            <div className="prose prose-neutral mt-10 max-w-none whitespace-pre-wrap text-foreground">
              {l.description}
            </div>
          )}

          <DockSpecCard l={l} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ContactForm listingId={l.id} />
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-serif text-2xl text-foreground">{value}</div>
    </div>
  );
}

type ListingRow = NonNullable<Awaited<ReturnType<typeof getPublicListing>>>["listing"];
function DockSpecCard({ l }: { l: ListingRow }) {
  const rows: Array<[string, string]> = [
    ["Type", l.kind === "home" ? "Waterfront home with dock" : "Boat slip"],
    ...(l.waterway ? [["Waterway", l.waterway]] as Array<[string, string]> : []),
    ...(l.dock_length_ft != null ? [["Dock length", `${l.dock_length_ft} ft`]] as Array<[string, string]> : []),
    ...(l.water_depth_ft != null ? [["Water depth", `${l.water_depth_ft} ft`]] as Array<[string, string]> : []),
    ...(l.max_boat_length_ft != null ? [["Max boat length", `${l.max_boat_length_ft} ft`]] as Array<[string, string]> : []),
    ...(l.power ? [["Shore power", l.power]] as Array<[string, string]> : []),
    ...[
      ["Water hookup", l.water_hookup ? "Yes" : "No"],
      ["Covered", l.covered ? "Yes" : "No"],
      ["Floating", l.floating ? "Yes" : "No"],
      ["Tidal", l.tidal ? "Yes" : "No"],
      ["Liveaboard allowed", l.liveaboard_allowed ? "Yes" : "No"],
    ] as Array<[string, string]>,
  ];
  return (
    <div className="mt-12 bg-muted/40 p-8 ring-1 ring-border">
      <h2 className="font-serif text-2xl">Dock specs</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border/60 pb-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Gallery({ photos, title }: { photos: Array<{ id: string; url: string }>; title: string }) {
  const [active, setActive] = useState(0);
  if (!photos.length) {
    return (
      <div className="flex aspect-[16/7] w-full items-center justify-center bg-muted text-muted-foreground">
        <Anchor className="h-16 w-16" strokeWidth={1} />
      </div>
    );
  }
  return (
    <div className="bg-nav">
      <div className="mx-auto max-w-7xl px-0 md:px-8">
        <div className="aspect-[16/9] w-full overflow-hidden bg-black">
          <img src={photos[active].url} alt={title} className="h-full w-full object-cover" />
        </div>
        {photos.length > 1 && (
          <div className="flex gap-1 overflow-x-auto bg-nav p-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1} of ${photos.length}`}
                aria-pressed={i === active}
                className={
                  "h-20 w-28 flex-shrink-0 overflow-hidden ring-2 transition-all " +
                  (i === active ? "ring-teak" : "ring-transparent opacity-70 hover:opacity-100")
                }
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactForm({ listingId }: { listingId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("I'd love to learn more about this property.");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await sendInquiry({
        data: {
          listing_id: listingId,
          from_name: name,
          from_email: email,
          from_phone: phone || undefined,
          message,
        },
      });
      toast.success("Message sent to the owner.");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-card p-6 ring-1 ring-border">
      <h2 className="font-serif text-2xl">Contact owner</h2>
      <p className="text-xs text-muted-foreground">
        Your message goes directly to the property owner. No agents involved.
      </p>
      <input
        required
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={160}
        className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={40}
        className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
      />
      <textarea
        required
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        className="w-full rounded-sm border border-input bg-transparent p-3 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-sm bg-teak py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground transition-colors hover:bg-teak/90 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
      {contactEmail && (
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Or email directly: <a className="text-teak" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      )}
    </form>
  );
}
