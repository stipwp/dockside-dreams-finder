/**
 * Cancellation & refund policy engine.
 *
 * Pure functions shared by the server (authoritative refund math) and the UI
 * (so the guest sees the exact same numbers before they confirm).
 */

export type PolicyId = "flexible" | "moderate" | "strict";

export type Policy = {
  id: PolicyId;
  label: string;
  summary: string;
  /** Full refund of the nightly subtotal when cancelling this many hours before check-in. */
  fullRefundHours: number;
  /** Partial refund percentage of the nightly subtotal after the full-refund window. */
  partialRefundPct: number;
  /** Cancelling within this many hours of check-in refunds nothing but the cleaning fee. */
  noRefundHours: number;
};

export const POLICIES: Record<PolicyId, Policy> = {
  flexible: {
    id: "flexible",
    label: "Flexible",
    summary: "Full refund up to 24 hours before check-in.",
    fullRefundHours: 24,
    partialRefundPct: 0,
    noRefundHours: 24,
  },
  moderate: {
    id: "moderate",
    label: "Moderate",
    summary: "Full refund up to 5 days before check-in, 50% after that.",
    fullRefundHours: 120,
    partialRefundPct: 50,
    noRefundHours: 24,
  },
  strict: {
    id: "strict",
    label: "Strict",
    summary: "Full refund only within 48 hours of booking and at least 14 days before check-in. 50% after that.",
    fullRefundHours: 336,
    partialRefundPct: 50,
    noRefundHours: 168,
  },
};

export function normalizePolicy(value: string | null | undefined): Policy {
  const key = (value ?? "moderate").toLowerCase().trim() as PolicyId;
  return POLICIES[key] ?? POLICIES.moderate;
}

export type RefundQuote = {
  policy: PolicyId;
  policyLabel: string;
  /** Portion of the nightly subtotal returned to the guest, in cents. */
  refundSubtotalCents: number;
  /** Cleaning fee is always refunded when the stay never happens. */
  refundCleaningCents: number;
  refundTotalCents: number;
  /** What the host keeps, in cents. */
  hostKeepsCents: number;
  refundPct: number;
  hoursToCheckIn: number;
  explanation: string;
};

type Booking = {
  start_date: string;
  subtotal_cents: number;
  cleaning_fee_cents: number;
  status?: string | null;
};

/**
 * Authoritative refund calculation. `now` is injectable so the server and the
 * UI preview agree, and so this is testable.
 */
export function quoteRefund(
  booking: Booking,
  policyValue: string | null | undefined,
  now: Date = new Date(),
): RefundQuote {
  const policy = normalizePolicy(policyValue);
  const checkIn = new Date(`${booking.start_date}T15:00:00Z`);
  const hoursToCheckIn = Math.max(0, (checkIn.getTime() - now.getTime()) / 3_600_000);

  let pct: number;
  let explanation: string;

  if (booking.status === "pending" || booking.status === "declined") {
    pct = 100;
    explanation = "The host had not accepted yet, so nothing is charged.";
  } else if (hoursToCheckIn >= policy.fullRefundHours) {
    pct = 100;
    explanation = `Cancelled more than ${formatWindow(policy.fullRefundHours)} before check-in — full refund.`;
  } else if (hoursToCheckIn >= policy.noRefundHours) {
    pct = policy.partialRefundPct;
    explanation =
      pct > 0
        ? `Cancelled inside the ${policy.label.toLowerCase()} window — ${pct}% of the nightly total is refunded.`
        : `Cancelled inside the ${policy.label.toLowerCase()} window — the nightly total is non-refundable.`;
  } else {
    pct = 0;
    explanation = `Cancelled within ${formatWindow(policy.noRefundHours)} of check-in — the nightly total is non-refundable.`;
  }

  const refundSubtotalCents = Math.round((booking.subtotal_cents * pct) / 100);
  const refundCleaningCents = booking.cleaning_fee_cents;
  const refundTotalCents = refundSubtotalCents + refundCleaningCents;

  return {
    policy: policy.id,
    policyLabel: policy.label,
    refundSubtotalCents,
    refundCleaningCents,
    refundTotalCents,
    hostKeepsCents: booking.subtotal_cents - refundSubtotalCents,
    refundPct: pct,
    hoursToCheckIn: Math.round(hoursToCheckIn),
    explanation,
  };
}

function formatWindow(hours: number): string {
  if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hours`;
}
