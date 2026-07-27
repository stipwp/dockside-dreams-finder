import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Anchor, Heart, Star, Zap } from "lucide-react";
import { formatPrice, locationLine } from "@/lib/format";

export type DockCardListing = {
  id: string;
  title: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  waterway?: string | null;
  cover_photo_url?: string | null;
  nightly_price_cents?: number | null;
  instant_book?: boolean | null;
  max_boat_length_ft?: number | null;
  water_depth_ft?: number | null;
};

export function DockCard({ l, compact }: { l: DockCardListing; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={saved ? `Remove ${l.title} from saved` : `Save ${l.title}`}
        aria-pressed={saved}
        onClick={() => setSaved((s) => !s)}
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/90 transition-transform hover:scale-110"
      >
        <Heart
          className={`h-6 w-6 drop-shadow ${saved ? "fill-primary text-primary" : "fill-black/25"}`}
          strokeWidth={2}
        />
      </button>

      <Link to="/rent/$id" params={{ id: l.id }} className="block">
        <div className={`${compact ? "aspect-[4/3]" : "aspect-square"} overflow-hidden rounded-xl bg-muted`}>
          {l.cover_photo_url ? (
            <img
              src={l.cover_photo_url}
              alt={`${l.title} — dock in ${locationLine(l) || "unknown location"}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Anchor className="h-10 w-10" strokeWidth={1.2} />
            </div>
          )}
        </div>

        <div className="mt-3 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-semibold">{locationLine(l) || l.title}</p>
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-foreground" /> New
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{l.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {l.max_boat_length_ft ? `Fits boats up to ${l.max_boat_length_ft}′` : "Boat size on request"}
            {l.water_depth_ft ? ` · ${l.water_depth_ft}′ depth` : ""}
          </p>
          <p className="pt-1 text-[15px]">
            <span className="font-semibold">{formatPrice(l.nightly_price_cents ?? 0)}</span>
            <span className="text-muted-foreground"> night</span>
            {l.instant_book && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-buoy/10 px-2 py-0.5 text-[11px] font-semibold text-buoy">
                <Zap className="h-3 w-3" /> Instant
              </span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}
