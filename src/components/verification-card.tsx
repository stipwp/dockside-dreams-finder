import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { getMyVerification, submitVerification } from "@/lib/trust.functions";

const COPY: Record<string, { label: string; tone: string; help: string }> = {
  verified: { label: "Verified", tone: "text-primary", help: "Your badge shows on your listings and booking requests." },
  pending: { label: "In review", tone: "text-foreground", help: "We usually review within one business day." },
  rejected: { label: "Needs attention", tone: "text-destructive", help: "Re-submit once your details are up to date." },
  unverified: { label: "Not verified", tone: "text-muted-foreground", help: "Verified members get more booking requests." },
};

/** Identity / trust status with a one-click submit for review. */
export function VerificationCard() {
  const qc = useQueryClient();
  const get = useServerFn(getMyVerification);
  const submit = useServerFn(submitVerification);
  const { data } = useQuery({ queryKey: ["my-verification"], queryFn: () => get() });

  const send = useMutation({
    mutationFn: () => submit({}),
    onSuccess: () => {
      toast.success("Submitted for review.");
      qc.invalidateQueries({ queryKey: ["my-verification"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not submit"),
  });

  const status = data?.identity_status ?? "unverified";
  const copy = COPY[status] ?? COPY.unverified;

  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ShieldCheck className="h-5 w-5" /> Verification
      </h2>
      <p className={`mt-3 flex items-center gap-2 text-sm font-bold ${copy.tone}`}>
        <BadgeCheck className="h-4 w-4" /> {copy.label}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{copy.help}</p>
      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        <li>Email confirmed: {data?.email_verified ? "Yes" : "No"}</li>
        <li>Phone confirmed: {data?.phone_verified ? "Yes" : "No"}</li>
      </ul>
      {data?.review_note && <p className="mt-3 text-sm text-muted-foreground">Reviewer note: {data.review_note}</p>}
      {status !== "verified" && status !== "pending" && (
        <button
          onClick={() => send.mutate()}
          disabled={send.isPending}
          className="mt-5 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60"
        >
          {send.isPending ? "Submitting…" : "Get verified"}
        </button>
      )}
    </section>
  );
}
