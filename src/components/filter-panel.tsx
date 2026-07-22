import { useState } from "react";
import type { ListingSearch } from "@/lib/listing-filters";
import { X } from "lucide-react";

type Props = {
  value: ListingSearch;
  onApply: (next: ListingSearch) => void;
  onClose?: () => void;
  variant?: "sidebar" | "sheet";
};

export function FilterPanel({ value, onApply, onClose, variant = "sidebar" }: Props) {
  const [v, setV] = useState<ListingSearch>(value);

  function set<K extends keyof ListingSearch>(k: K, val: ListingSearch[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  function reset() {
    const cleared: ListingSearch = { view: v.view, q: v.q };
    setV(cleared);
    onApply(cleared);
  }

  const isSlip = v.kind === "slip";
  const isHome = v.kind === "home";

  return (
    <aside
      className={
        variant === "sheet"
          ? "flex h-full flex-col bg-background"
          : "sticky top-20 hidden max-h-[calc(100vh-6rem)] w-72 shrink-0 flex-col overflow-y-auto border border-border bg-background lg:flex"
      }
    >
      <header className="flex items-center justify-between border-b border-border bg-nav px-5 py-4 text-nav-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Refine search</p>
        {onClose && (
          <button onClick={onClose} className="text-nav-foreground/70 hover:text-teak" aria-label="Close filters">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-6 px-5 py-5">
        <Section label="Property type">
          <div className="grid grid-cols-3 gap-1">
            {[
              { l: "All", v: undefined },
              { l: "Homes", v: "home" as const },
              { l: "Slips", v: "slip" as const },
            ].map((o) => {
              const active = v.kind === o.v;
              return (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => set("kind", o.v)}
                  className={
                    "rounded-sm px-2 py-2 text-[10px] font-semibold uppercase tracking-widest " +
                    (active ? "bg-nav text-nav-foreground" : "bg-muted text-foreground ring-1 ring-border")
                  }
                >
                  {o.l}
                </button>
              );
            })}
          </div>
        </Section>

        {isSlip && (
          <Section label="Rental period">
            <select
              className={sel}
              value={v.period ?? ""}
              onChange={(e) => set("period", (e.target.value || undefined) as ListingSearch["period"])}
            >
              <option value="">Any</option>
              <option value="month">Per month</option>
              <option value="season">Per season</option>
              <option value="sale">Slip for sale</option>
            </select>
          </Section>
        )}

        <Section label="Price (USD)">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Min" type="number" min={0} className={inp}
              value={v.minPrice ?? ""} onChange={(e) => set("minPrice", num(e.target.value))} />
            <input placeholder="Max" type="number" min={0} className={inp}
              value={v.maxPrice ?? ""} onChange={(e) => set("maxPrice", num(e.target.value))} />
          </div>
        </Section>

        <Section label="Location">
          <input placeholder="State (e.g. FL)" className={inp}
            value={v.state ?? ""} onChange={(e) => set("state", e.target.value || undefined)} />
        </Section>

        {isHome && (
          <Section label="Home">
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Min beds" value={v.minBeds} onChange={(x) => set("minBeds", x)} />
              <LabeledInput label="Min baths" value={v.minBaths} step={0.5} onChange={(x) => set("minBaths", x)} />
            </div>
          </Section>
        )}

        <Section label="Dock & boat">
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="Min dock (ft)" value={v.minDockLen} onChange={(x) => set("minDockLen", x)} />
            <LabeledInput label="Max boat (ft)" value={v.minBoatLen} onChange={(x) => set("minBoatLen", x)} />
            <LabeledInput label="Min depth (ft)" value={v.minDepth} step={0.5} onChange={(x) => set("minDepth", x)} />
            <div>
              <p className={lab}>Shore power</p>
              <select className={sel} value={v.power ?? ""} onChange={(e) => set("power", e.target.value || undefined)}>
                <option value="">Any</option>
                <option value="30A">30 amp</option>
                <option value="50A">50 amp</option>
                <option value="100A">100 amp</option>
              </select>
            </div>
          </div>
        </Section>

        <Section label="Slip features">
          <div className="space-y-2">
            <Toggle label="Covered slip" checked={!!v.covered} onChange={(x) => set("covered", x || undefined)} />
            <Toggle label="Floating dock" checked={!!v.floating} onChange={(x) => set("floating", x || undefined)} />
            <Toggle label="Water hookup" checked={!!v.water_hookup} onChange={(x) => set("water_hookup", x || undefined)} />
            <Toggle label="Liveaboard allowed" checked={!!v.liveaboard_allowed} onChange={(x) => set("liveaboard_allowed", x || undefined)} />
            <Toggle label="Tidal water" checked={!!v.tidal} onChange={(x) => set("tidal", x || undefined)} />
          </div>
        </Section>
      </div>

      <footer className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4">
        <button
          type="button"
          onClick={reset}
          className="flex-1 rounded-sm bg-muted px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-foreground ring-1 ring-border hover:bg-muted/70"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => onApply(v)}
          className="flex-[2] rounded-sm bg-teak px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-teak-foreground hover:bg-teak/90"
        >
          Apply filters
        </button>
      </footer>
    </aside>
  );
}

function num(s: string): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

const inp = "h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:border-teak";
const sel = "h-10 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus:border-teak";
const lab = "mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-teak">{label}</p>
      {children}
    </div>
  );
}

function LabeledInput({
  label, value, onChange, step,
}: { label: string; value?: number; onChange: (n: number | undefined) => void; step?: number }) {
  return (
    <div>
      <p className={lab}>{label}</p>
      <input
        type="number"
        min={0}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(num(e.target.value))}
        className={inp}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border bg-background px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-teak"
      />
    </label>
  );
}
