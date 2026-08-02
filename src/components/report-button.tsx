import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/trust.functions";

const REASONS = [
  "Inaccurate listing details",
  "Scam or suspicious behaviour",
  "Off-platform payment request",
  "Offensive or unsafe content",
  "Dock does not exist",
  "Something else",
];

/** Inline report control for listings, users, and bookings. */
export function ReportButton({
  targetType,
  targetId,
  label = "Report this listing",
}: {
  targetType: "listing" | "user" | "message" | "booking";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const send = useServerFn(submitReport);

  const report = useMutation({
    mutationFn: () => send({ data: { target_type: targetType, target_id: targetId, reason, details } }),
    onSuccess: () => {
      toast.success("Thanks — our team will review this.");
      setOpen(false);
      setDetails("");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error && /unauthor|401/i.test(e.message)
          ? "Log in to report this."
          : e instanceof Error
            ? e.message
            : "Could not send report",
      ),
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        <Flag className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports are confidential and reviewed by the DockFront team.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Reason
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-foreground"
              >
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Details (optional)
              </span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-foreground"
              />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => report.mutate()}
                disabled={report.isPending}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {report.isPending ? "Sending…" : "Submit report"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
