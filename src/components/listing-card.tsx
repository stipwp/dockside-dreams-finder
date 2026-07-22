import { Link } from "@tanstack/react-router";
import { formatPrice, locationLine } from "@/lib/format";
import { Bed, Bath, Anchor, Ruler } from "lucide-react";

type CardListing = {
  id: string;
  kind: "home" | "slip";
  title: string;
  price_cents: number;
  price_period: string | null;
  city?: string | null;
  state?: string | null;
  waterway?: string | null;
  cover_photo_url?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  dock_length_ft?: number | null;
  max_boat_length_ft?: number | null;
  featured?: boolean | null;
};

export function ListingCard({ l }: { l: CardListing }) {
  return (
    <Link
      to="/listings/$id"
      params={{ id: l.id }}
      className="group block overflow-hidden bg-card ring-1 ring-border transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {l.cover_photo_url ? (
          <img
            src={l.cover_photo_url}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Anchor className="h-10 w-10" strokeWidth={1} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {l.featured && (
            <span className="bg-teak px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-teak-foreground">
              Featured
            </span>
          )}
          <span
            className={
              "px-2 py-1 text-[10px] font-semibold uppercase tracking-widest " +
              (l.kind === "home"
                ? "bg-nav text-nav-foreground"
                : "bg-buoy text-buoy-foreground")
            }
          >
            {l.kind === "home" ? "For sale" : l.price_period === "sale" ? "Slip for sale" : "Slip for rent"}
          </span>
        </div>
      </div>
      <div className="space-y-2 p-5">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {locationLine(l) || "United States"}
        </div>
        <h3 className="line-clamp-1 font-serif text-xl text-foreground">{l.title}</h3>
        <div className="flex items-center justify-between pt-2">
          <span className="font-serif text-xl text-teak">
            {formatPrice(l.price_cents, l.price_period)}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {l.kind === "home" ? (
              <>
                {l.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" /> {l.bedrooms}
                  </span>
                )}
                {l.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" /> {l.bathrooms}
                  </span>
                )}
              </>
            ) : (
              <>
                {l.dock_length_ft != null && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" /> {l.dock_length_ft}′
                  </span>
                )}
                {l.max_boat_length_ft != null && (
                  <span className="flex items-center gap-1">
                    <Anchor className="h-3.5 w-3.5" /> {l.max_boat_length_ft}′ max
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
