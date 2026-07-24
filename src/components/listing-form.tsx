import { useState } from "react";

export type ListingType = "home_sale" | "slip_lease" | "slip_short_term";

export type ListingFormValues = {
  listing_type: ListingType;
  title: string;
  description?: string | null;
  price_cents: number;
  price_period?: "sale" | "month" | "season" | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  waterway?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  lat?: number | null;
  lng?: number | null;
  dock_length_ft?: number | null;
  water_depth_ft?: number | null;
  max_boat_length_ft?: number | null;
  max_boat_beam_ft?: number | null;
  max_boat_draft_ft?: number | null;
  power?: string | null;
  water_hookup?: boolean;
  covered?: boolean;
  floating?: boolean;
  tidal?: boolean;
  liveaboard_allowed?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  cover_photo_url?: string | null;
  // Short-term rental
  nightly_price_cents?: number | null;
  weekly_price_cents?: number | null;
  cleaning_fee_cents?: number;
  min_nights?: number;
  max_nights?: number | null;
  instant_book?: boolean;
  max_guests?: number;
  status: "draft" | "published";
};

const DEFAULTS: ListingFormValues = {
  listing_type: "home_sale",
  title: "",
  description: "",
  price_cents: 0,
  price_period: "sale",
  address: "",
  city: "",
  state: "",
  waterway: "",
  bedrooms: null,
  bathrooms: null,
  sqft: null,
  lat: null,
  lng: null,
  dock_length_ft: null,
  water_depth_ft: null,
  max_boat_length_ft: null,
  max_boat_beam_ft: null,
  max_boat_draft_ft: null,
  power: "",
  water_hookup: false,
  covered: false,
  floating: false,
  tidal: false,
  liveaboard_allowed: false,
  contact_email: "",
  contact_phone: "",
  cover_photo_url: "",
  nightly_price_cents: null,
  weekly_price_cents: null,
  cleaning_fee_cents: 0,
  min_nights: 1,
  max_nights: null,
  instant_book: false,
  max_guests: 4,
  status: "draft",
};

const TYPE_OPTIONS: Array<{ value: ListingType; label: string; hint: string }> = [
  { value: "home_sale", label: "Waterfront home", hint: "For sale" },
  { value: "slip_lease", label: "Dock slip lease", hint: "Monthly / seasonal" },
  { value: "slip_short_term", label: "Short-term dock", hint: "Nightly bookings" },
];

export function ListingForm({
  initial,
  onSubmit,
  submitLabel = "Save draft",
}: {
  initial?: Partial<ListingFormValues>;
  onSubmit: (values: ListingFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [v, setV] = useState<ListingFormValues>({ ...DEFAULTS, ...initial });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setV((s) => ({ ...s, [key]: value }));
  }

  const isHome = v.listing_type === "home_sale";
  const isShort = v.listing_type === "slip_short_term";
  const isLease = v.listing_type === "slip_lease";

  async function submit(e: React.FormEvent, status: "draft" | "published") {
    e.preventDefault();
    setBusy(true);
    try {
      const clean: ListingFormValues = { ...v, status };
      // Auto-set price_period based on type
      if (isHome) clean.price_period = "sale";
      else if (isShort) clean.price_period = null;
      (
        ["bedrooms", "bathrooms", "sqft", "lat", "lng", "dock_length_ft", "water_depth_ft", "max_boat_length_ft", "max_boat_beam_ft", "max_boat_draft_ft", "nightly_price_cents", "weekly_price_cents", "max_nights"] as const
      ).forEach((k) => {
        const val = clean[k];
        if (val === null || val === undefined || Number.isNaN(val as number)) {
          (clean as unknown as Record<string, unknown>)[k] = null;
        }
      });
      (["description", "address", "city", "state", "waterway", "power", "contact_email", "contact_phone", "cover_photo_url"] as const).forEach((k) => {
        if (!clean[k]) (clean as unknown as Record<string, unknown>)[k] = null;
      });
      await onSubmit(clean);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => submit(e, v.status)} className="space-y-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TYPE_OPTIONS.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => set("listing_type", t.value)}
            className={
              "rounded-sm px-4 py-3 text-left " +
              (v.listing_type === t.value ? "bg-nav text-nav-foreground ring-2 ring-teak" : "bg-muted text-foreground ring-1 ring-border")
            }
          >
            <div className="text-xs font-semibold uppercase tracking-[0.14em]">{t.label}</div>
            <div className={"mt-0.5 text-[10px] uppercase tracking-widest " + (v.listing_type === t.value ? "text-teak" : "text-muted-foreground")}>{t.hint}</div>
          </button>
        ))}
      </div>

      <Field label="Title">
        <input required maxLength={140} value={v.title} onChange={(e) => set("title", e.target.value)} className={input} />
      </Field>

      {!isShort && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isHome ? "Sale price (USD)" : "Lease price (USD)"}>
            <input
              required
              type="number"
              min={0}
              value={Math.round(v.price_cents / 100) || ""}
              onChange={(e) => set("price_cents", Math.round(Number(e.target.value || 0) * 100))}
              className={input}
            />
          </Field>
          {isLease && (
            <Field label="Rental period">
              <select
                value={v.price_period ?? "month"}
                onChange={(e) => set("price_period", e.target.value as ListingFormValues["price_period"])}
                className={input}
              >
                <option value="month">Per month</option>
                <option value="season">Per season</option>
              </select>
            </Field>
          )}
        </div>
      )}

      {isShort && (
        <div className="border-t border-border pt-6">
          <h3 className="font-serif text-2xl">Nightly booking</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Nightly rate (USD)">
              <input
                required
                type="number"
                min={0}
                value={v.nightly_price_cents ? Math.round(v.nightly_price_cents / 100) : ""}
                onChange={(e) => {
                  const cents = e.target.value ? Math.round(Number(e.target.value) * 100) : null;
                  set("nightly_price_cents", cents);
                  if (cents) set("price_cents", cents);
                }}
                className={input}
              />
            </Field>
            <Field label="Cleaning fee (USD)">
              <input
                type="number"
                min={0}
                value={v.cleaning_fee_cents ? Math.round(v.cleaning_fee_cents / 100) : ""}
                onChange={(e) => set("cleaning_fee_cents", Math.round(Number(e.target.value || 0) * 100))}
                className={input}
              />
            </Field>
            <Field label="Weekly rate (USD, optional)">
              <input
                type="number"
                min={0}
                value={v.weekly_price_cents ? Math.round(v.weekly_price_cents / 100) : ""}
                onChange={(e) => set("weekly_price_cents", e.target.value ? Math.round(Number(e.target.value) * 100) : null)}
                className={input}
              />
            </Field>
            <Field label="Min nights">
              <input type="number" min={1} value={v.min_nights ?? 1} onChange={(e) => set("min_nights", Number(e.target.value || 1))} className={input} />
            </Field>
            <Field label="Max nights">
              <input type="number" min={1} value={v.max_nights ?? ""} onChange={(e) => set("max_nights", e.target.value ? Number(e.target.value) : null)} className={input} placeholder="No max" />
            </Field>
            <Field label="Max guests aboard">
              <input type="number" min={1} value={v.max_guests ?? 4} onChange={(e) => set("max_guests", Number(e.target.value || 1))} className={input} />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-sm border border-border p-3 text-sm">
            <input type="checkbox" checked={!!v.instant_book} onChange={(e) => set("instant_book", e.target.checked)} className="accent-teak" />
            Instant book (skip host approval)
          </label>
        </div>
      )}

      <Field label="Description">
        <textarea rows={5} maxLength={4000} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <input value={v.city ?? ""} onChange={(e) => set("city", e.target.value)} className={input} />
        </Field>
        <Field label="State">
          <input value={v.state ?? ""} onChange={(e) => set("state", e.target.value)} className={input} />
        </Field>
        <Field label="Waterway">
          <input value={v.waterway ?? ""} onChange={(e) => set("waterway", e.target.value)} className={input} placeholder="e.g. Chesapeake Bay" />
        </Field>
      </div>
      <Field label="Address (not shown publicly)">
        <input value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude (for map)">
          <input type="number" step="any" min={-90} max={90} value={v.lat ?? ""} onChange={(e) => set("lat", e.target.value ? Number(e.target.value) : null)} className={input} placeholder="e.g. 27.9506" />
        </Field>
        <Field label="Longitude (for map)">
          <input type="number" step="any" min={-180} max={180} value={v.lng ?? ""} onChange={(e) => set("lng", e.target.value ? Number(e.target.value) : null)} className={input} placeholder="e.g. -82.4572" />
        </Field>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Tip: right-click your dock on Google Maps and copy the coordinates. Listings without lat/lng won't appear on the map view.
      </p>

      {isHome && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bedrooms">
            <input type="number" min={0} value={v.bedrooms ?? ""} onChange={(e) => set("bedrooms", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min={0} step={0.5} value={v.bathrooms ?? ""} onChange={(e) => set("bathrooms", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Sq ft">
            <input type="number" min={0} value={v.sqft ?? ""} onChange={(e) => set("sqft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <h3 className="font-serif text-2xl">Dock specs</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Dock length (ft)">
            <input type="number" min={0} value={v.dock_length_ft ?? ""} onChange={(e) => set("dock_length_ft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Water depth (ft)">
            <input type="number" min={0} step={0.5} value={v.water_depth_ft ?? ""} onChange={(e) => set("water_depth_ft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Max boat length (ft)">
            <input type="number" min={0} value={v.max_boat_length_ft ?? ""} onChange={(e) => set("max_boat_length_ft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Max boat beam (ft)">
            <input type="number" min={0} step={0.5} value={v.max_boat_beam_ft ?? ""} onChange={(e) => set("max_boat_beam_ft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Max draft (ft)">
            <input type="number" min={0} step={0.5} value={v.max_boat_draft_ft ?? ""} onChange={(e) => set("max_boat_draft_ft", e.target.value ? Number(e.target.value) : null)} className={input} />
          </Field>
          <Field label="Shore power">
            <input value={v.power ?? ""} onChange={(e) => set("power", e.target.value)} placeholder="30A / 50A" className={input} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Toggle label="Water hookup" checked={!!v.water_hookup} onChange={(x) => set("water_hookup", x)} />
          <Toggle label="Covered" checked={!!v.covered} onChange={(x) => set("covered", x)} />
          <Toggle label="Floating" checked={!!v.floating} onChange={(x) => set("floating", x)} />
          <Toggle label="Tidal" checked={!!v.tidal} onChange={(x) => set("tidal", x)} />
          <Toggle label="Liveaboard allowed" checked={!!v.liveaboard_allowed} onChange={(x) => set("liveaboard_allowed", x)} />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-serif text-2xl">How buyers reach you</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Contact email">
            <input type="email" value={v.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} className={input} />
          </Field>
          <Field label="Contact phone">
            <input value={v.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} className={input} />
          </Field>
        </div>
        {isShort && (
          <p className="mt-3 text-xs text-muted-foreground">
            For short-term bookings, guests message you inside DockFront — this contact info stays private.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(e, "draft")}
          className="rounded-sm bg-muted px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground ring-1 ring-border disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(e, "published")}
          className="rounded-sm bg-teak px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground hover:bg-teak/90 disabled:opacity-60"
        >
          Publish listing
        </button>
      </div>
    </form>
  );
}

const input =
  "h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm outline-none focus:border-teak";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border p-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
