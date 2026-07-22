import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import { formatPrice, locationLine } from "@/lib/format";

type MapListing = {
  id: string;
  kind: "home" | "slip";
  title: string;
  price_cents: number;
  price_period: string | null;
  city?: string | null;
  state?: string | null;
  lat: number | null;
  lng: number | null;
  cover_photo_url?: string | null;
};

// Custom svg pin — nautical navy w/ teak accent, differentiated for slip vs home
function pinIcon(kind: "home" | "slip") {
  const bg = kind === "home" ? "#0B1F33" : "#D9482B";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="${bg}" stroke="#F7F5EF" stroke-width="2"/>
      <circle cx="16" cy="16" r="5" fill="#B08256"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "dockfront-pin",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    const b = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export default function ListingsMap({ listings }: { listings: MapListing[] }) {
  const points = useMemo(
    () =>
      listings
        .filter((l): l is MapListing & { lat: number; lng: number } => l.lat != null && l.lng != null)
        .map((l) => [l.lat, l.lng] as [number, number]),
    [listings],
  );

  const center: [number, number] = points[0] ?? [38.5, -80]; // US-ish

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: 500 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {listings.map((l) =>
        l.lat != null && l.lng != null ? (
          <Marker key={l.id} position={[l.lat, l.lng]} icon={pinIcon(l.kind)}>
            <Popup>
              <div className="w-56">
                {l.cover_photo_url && (
                  <img
                    src={l.cover_photo_url}
                    alt={l.title}
                    className="mb-2 h-28 w-full object-cover"
                  />
                )}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-teak">
                  {l.kind === "home" ? "Waterfront home" : "Dock slip"}
                </p>
                <p className="mt-0.5 font-serif text-base leading-tight">{l.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{locationLine(l)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-serif text-sm text-teak">
                    {formatPrice(l.price_cents, l.price_period)}
                  </span>
                  <Link
                    to="/listings/$id"
                    params={{ id: l.id }}
                    className="text-[10px] font-semibold uppercase tracking-widest text-nav hover:text-teak"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
