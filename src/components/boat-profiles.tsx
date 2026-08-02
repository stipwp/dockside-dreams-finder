import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Ship, Trash2 } from "lucide-react";
import { deleteBoat, listMyBoats, saveBoat } from "@/lib/trust.functions";

type Draft = {
  id?: string;
  name: string;
  length_ft: string;
  beam_ft: string;
  draft_ft: string;
  air_draft_ft: string;
  power_need: string;
  is_default: boolean;
};

const EMPTY: Draft = {
  name: "",
  length_ft: "",
  beam_ft: "",
  draft_ft: "",
  air_draft_ft: "",
  power_need: "",
  is_default: false,
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** Saved boats so guests can auto-fill fit checks at booking time. */
export function BoatProfiles() {
  const qc = useQueryClient();
  const list = useServerFn(listMyBoats);
  const save = useServerFn(saveBoat);
  const remove = useServerFn(deleteBoat);
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: boats } = useQuery({ queryKey: ["my-boats"], queryFn: () => list() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-boats"] });

  const saving = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          name: d.name,
          length_ft: num(d.length_ft),
          beam_ft: num(d.beam_ft),
          draft_ft: num(d.draft_ft),
          air_draft_ft: num(d.air_draft_ft),
          power_need: d.power_need || null,
          is_default: d.is_default,
        },
      }),
    onSuccess: () => {
      toast.success("Boat saved.");
      setDraft(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save boat"),
  });

  const deleting = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Boat removed.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove boat"),
  });

  return (
    <section className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Ship className="h-5 w-5" /> Your boats
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save your dimensions once and every dock shows whether you fit.
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft({ ...EMPTY })}
            className="shrink-0 rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            Add boat
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {(boats ?? []).map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <div>
              <p className="font-semibold">
                {b.name}
                {b.is_default && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">default</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {[
                  b.length_ft && `${b.length_ft} ft LOA`,
                  b.beam_ft && `${b.beam_ft} ft beam`,
                  b.draft_ft && `${b.draft_ft} ft draft`,
                  b.power_need,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No dimensions yet"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: b.id,
                    name: b.name,
                    length_ft: b.length_ft?.toString() ?? "",
                    beam_ft: b.beam_ft?.toString() ?? "",
                    draft_ft: b.draft_ft?.toString() ?? "",
                    air_draft_ft: b.air_draft_ft?.toString() ?? "",
                    power_need: b.power_need ?? "",
                    is_default: b.is_default,
                  })
                }
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => deleting.mutate(b.id)}
                aria-label={`Remove ${b.name}`}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {!boats?.length && !draft && (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No boats saved yet.
          </p>
        )}

        {draft && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saving.mutate(draft);
            }}
            className="rounded-xl border border-border p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Boat name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} required />
              <Input label="Length (ft)" value={draft.length_ft} onChange={(v) => setDraft({ ...draft, length_ft: v })} type="number" />
              <Input label="Beam (ft)" value={draft.beam_ft} onChange={(v) => setDraft({ ...draft, beam_ft: v })} type="number" />
              <Input label="Draft (ft)" value={draft.draft_ft} onChange={(v) => setDraft({ ...draft, draft_ft: v })} type="number" />
              <Input label="Air draft (ft)" value={draft.air_draft_ft} onChange={(v) => setDraft({ ...draft, air_draft_ft: v })} type="number" />
              <Input label="Power need" value={draft.power_need} onChange={(v) => setDraft({ ...draft, power_need: v })} placeholder="30A / 50A" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_default}
                onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
              />
              Use as my default boat
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving.isPending}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving.isPending ? "Saving…" : "Save boat"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type={type}
        step="any"
        min={type === "number" ? 0 : undefined}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
