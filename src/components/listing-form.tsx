import { useState } from "react";

export type ListingFormValues = {
  kind: "home" | "slip";
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
  dock_length_ft?: number | null;
  water_depth_ft?: number | null;
  max_boat_length_ft?: number | null;
  power?: string | null;
  water_hookup?: boolean;
  covered?: boolean;
  floating?: boolean;
  tidal?: boolean;
  liveaboard_allowed?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  cover_photo_url?: string | null;
  status: "draft" | "published";
};

const DEFAULTS: ListingFormValues = {
  kind: "home",
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
  dock_length_ft: null,
  water_depth_ft: null,
  max_boat_length_ft: null,
  power: "",
  water_hookup: false,
  covered: false,
  floating: false,
  tidal: false,
  liveaboard_allowed: false,
  contact_email: "",
  contact_phone: "",
  cover_photo_url: "",
  status: "draft",
};

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

  async function submit(e: React.FormEvent, status: "draft" | "published") {
    e.preventDefault();
    setBusy(true);
    try {
      // sanitize nulls
      const clean: ListingFormValues = { ...v, status };
      (
        ["bedrooms", "bathrooms", "sqft", "dock_length_ft", "water_depth_ft", "max_boat_length_ft"] as const
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
      <div className="flex gap-2">
        {(["home", "slip"] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => set("kind", k)}
            className={
              "flex-1 rounded-sm px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] " +
              (v.kind === k ? "bg-nav text-nav-foreground" : "bg-muted text-foreground ring-1 ring-border")
            }
          >
            {k === "home" ? "Waterfront home" : "Dock slip"}
          </button>
        ))}
      </div>

      <Field label="Title">
        <input required maxLength={140} value={v.title} onChange={(e) => set("title", e.target.value)} className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (USD)">
          <input
            required
            type="number"
            min={0}
            value={Math.round(v.price_cents / 100) || ""}
            onChange={(e) => set("price_cents", Math.round(Number(e.target.value || 0) * 100))}
            className={input}
          />
        </Field>
        <Field label={v.kind === "home" ? "Terms" : "Rental period"}>
          <select
            value={v.price_period ?? "sale"}
            onChange={(e) => set("price_period", e.target.value as ListingFormValues["price_period"])}
            className={input}
          >
            {v.kind === "home" ? (
              <option value="sale">For sale</option>
            ) : (
              <>
                <option value="month">Per month</option>
                <option value="season">Per season</option>
                <option value="sale">For sale (slip)</option>
              </>
            )}
          </select>
        </Field>
      </div>

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

      {v.kind === "home" && (
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
