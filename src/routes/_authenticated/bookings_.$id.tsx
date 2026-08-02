import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  cancelBooking,
  previewCancellation,
  getMyBooking,
  listBookingMessages,
  respondToBooking,
  sendBookingMessage,
} from "@/lib/bookings.functions";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Send, Ship, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookings_/$id")({
  head: () => ({
    meta: [{ title: "Booking details — DockFront" }, { name: "robots", content: "noindex" }],
  }),
  component: BookingDetail,
});

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  pending: "bg-muted text-foreground",
  declined: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

function BookingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchBooking = useServerFn(getMyBooking);
  const fetchMessages = useServerFn(listBookingMessages);
  const [me, setMe] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBooking({ data: { id } }),
  });
  const { data: messages } = useQuery({
    queryKey: ["booking-messages", id],
    queryFn: () => fetchMessages({ data: { booking_id: id } }),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages?.length]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["my-trips"] });
    qc.invalidateQueries({ queryKey: ["host-bookings"] });
  };

  const respond = useMutation({
    mutationFn: (action: "accept" | "decline") => respondToBooking({ data: { id, action } }),
    onSuccess: (_r, action) => {
      toast.success(action === "accept" ? "Booking confirmed." : "Request declined.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const cancel = useMutation({
    mutationFn: () => cancelBooking({ data: { id } }),
    onSuccess: () => {
      toast.success("Booking cancelled.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const send = useMutation({
    mutationFn: (body: string) => sendBookingMessage({ data: { booking_id: id, body } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["booking-messages", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Message failed"),
  });

  if (isLoading) {
    return (
      <Shell>
        <p className="text-muted-foreground">Loading booking…</p>
      </Shell>
    );
  }

  if (!booking) {
    return (
      <Shell>
        <p className="text-xl font-bold">Booking not found</p>
        <button
          onClick={() => navigate({ to: "/trips" })}
          className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
        >
          Back to trips
        </button>
      </Shell>
    );
  }

  const isHost = me === booking.host_id;
  const listing = booking.listings;
  const canCancel = booking.status === "pending" || booking.status === "accepted";
  const { data: refund } = useQuery({
    queryKey: ["cancellation-quote", id],
    queryFn: () => previewCancellation({ data: { id } }),
    enabled: canCancel,
    retry: false,
  });
  const stayEnded = booking.end_date <= new Date().toISOString().slice(0, 10);

  return (
    <Shell>
      <Link
        to={isHost ? "/bookings" : "/trips"}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {isHost ? "Booking requests" : "Your trips"}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                STATUS_STYLES[booking.status] ?? "bg-muted"
              }`}
            >
              {booking.status}
            </span>
            <span className="text-sm text-muted-foreground">
              {isHost ? "You're hosting" : "Your reservation"}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {listing?.title ?? "Dock booking"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {[listing?.city, listing?.state].filter(Boolean).join(", ")}
          </p>

          <ol className="mt-8 space-y-4 border-l border-border pl-6">
            <Step
              done
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Request submitted"
              detail={new Date(booking.created_at).toLocaleString()}
            />
            <Step
              done={booking.status === "accepted"}
              icon={
                booking.status === "declined" || booking.status === "cancelled" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )
              }
              title={
                booking.status === "accepted"
                  ? "Confirmed by host"
                  : booking.status === "declined"
                    ? "Declined by host"
                    : booking.status === "cancelled"
                      ? "Cancelled"
                      : "Waiting on host"
              }
              detail={booking.host_note ?? undefined}
            />
            <Step
              done={booking.status === "accepted" && stayEnded}
              icon={<Ship className="h-4 w-4" />}
              title={stayEnded ? "Stay complete" : "Upcoming stay"}
              detail={`${booking.start_date} → ${booking.end_date}`}
            />
          </ol>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Messages</h2>
            <div className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-border p-4">
              {messages && messages.length ? (
                messages.map((m) => (
                  <div key={m.id} className={m.sender_id === me ? "text-right" : ""}>
                    <div
                      className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        m.sender_id === me
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.body}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No messages yet — say hello and share your arrival plan.
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const body = draft.trim();
                if (body) send.mutate(body);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                placeholder="Write a message…"
                aria-label="Message"
                className="h-12 flex-1 rounded-xl border border-border px-4 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={send.isPending || !draft.trim()}
                className="flex h-12 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-background disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border p-5 shadow-card lg:sticky lg:top-24">
          {listing?.cover_photo_url && (
            <img
              src={listing.cover_photo_url}
              alt={listing.title ?? "Dock"}
              className="h-36 w-full rounded-xl object-cover"
            />
          )}
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Dates" value={`${booking.start_date} → ${booking.end_date}`} />
            <Row label="Nights" value={String(booking.nights)} />
            <Row label="Guests" value={String(booking.guests)} />
            {booking.boat_name && <Row label="Boat" value={booking.boat_name} />}
            {booking.boat_length_ft && <Row label="Length" value={`${booking.boat_length_ft} ft`} />}
            {booking.boat_beam_ft && <Row label="Beam" value={`${booking.boat_beam_ft} ft`} />}
            {booking.boat_draft_ft && <Row label="Draft" value={`${booking.boat_draft_ft} ft`} />}
          </dl>
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <Row label={`${booking.nights} nights`} value={formatPrice(booking.subtotal_cents)} />
            {booking.cleaning_fee_cents > 0 && (
              <Row label="Cleaning fee" value={formatPrice(booking.cleaning_fee_cents)} />
            )}
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold">
              <span>Total</span>
              <span>{formatPrice(booking.total_cents)}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {isHost && booking.status === "pending" && (
              <>
                <button
                  onClick={() => respond.mutate("accept")}
                  disabled={respond.isPending}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                  Accept request
                </button>
                <button
                  onClick={() => respond.mutate("decline")}
                  disabled={respond.isPending}
                  className="w-full rounded-xl border border-border py-3 text-sm font-bold disabled:opacity-60"
                >
                  Decline
                </button>
              </>
            )}
            {canCancel && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-bold">Cancellation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {refund
                    ? refund.explanation
                    : "Checking what you'd get back…"}
                </p>
                {refund && (
                  <p className="mt-2 text-sm font-semibold">
                    Estimated refund: {formatPrice(refund.refundTotalCents)}
                  </p>
                )}
                <button
                  onClick={() => {
                    const line = refund
                      ? `${refund.explanation} Estimated refund ${formatPrice(refund.refundTotalCents)}.`
                      : "";
                    if (confirm(`Cancel this booking?\n\n${line}`)) cancel.mutate();
                  }}
                  disabled={cancel.isPending}
                  className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:text-destructive disabled:opacity-60"
                >
                  Cancel booking
                </button>
              </div>
            )}
            {!isHost && booking.status === "accepted" && stayEnded && (
              <Link
                to="/reviews"
                className="block w-full rounded-xl bg-foreground py-3 text-center text-sm font-bold text-background"
              >
                Write a review
              </Link>
            )}
            {listing?.id && (
              <Link
                to="/rent/$id"
                params={{ id: listing.id }}
                className="block w-full rounded-xl border border-border py-3 text-center text-sm font-bold"
              >
                View dock
              </Link>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Step({
  done,
  icon,
  title,
  detail,
}: {
  done?: boolean;
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[2.05rem] flex h-6 w-6 items-center justify-center rounded-full ${
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </li>
  );
}
