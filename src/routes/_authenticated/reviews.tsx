import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { createReview, listReviewableStays } from "@/lib/reviews.functions";
import { toast } from "sonner";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [{ title: "Write a review — DockFront" }, { name: "robots", content: "noindex" }],
  }),
  component: Reviews,
});

function Reviews() {
  const qc = useQueryClient();
  const fetchStays = useServerFn(listReviewableStays);
  const { data, isLoading } = useQuery({ queryKey: ["reviewable-stays"], queryFn: () => fetchStays() });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Rate the docks you've stayed at. Reviews go live on the listing right away.
        </p>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading your stays…</p>}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <Star className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-lg font-bold">Nothing to review yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once a confirmed stay ends, it shows up here.
            </p>
            <Link
              to="/rent"
              className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Find a dock
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {(data ?? []).map((s) => (
            <ReviewCard
              key={s.id}
              bookingId={s.id}
              title={s.listings?.title ?? "Dock stay"}
              place={[s.listings?.city, s.listings?.state ?? s.listings?.country].filter(Boolean).join(", ")}
              endDate={s.end_date}
              cover={s.listings?.cover_photo_url ?? null}
              onDone={() => {
                qc.invalidateQueries({ queryKey: ["reviewable-stays"] });
              }}
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ReviewCard({
  bookingId,
  title,
  place,
  endDate,
  cover,
  onDone,
}: {
  bookingId: string;
  title: string;
  place: string;
  endDate: string;
  cover: string | null;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");

  const submit = useMutation({
    mutationFn: () => createReview({ data: { booking_id: bookingId, rating, body: body || undefined } }),
    onSuccess: () => {
      toast.success("Thanks for the review!");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save review"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return toast.error("Pick a star rating first.");
        submit.mutate();
      }}
      className="rounded-2xl border border-border p-5"
    >
      <div className="flex gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">
            {place} · stay ended {endDate}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={rating === n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1"
          >
            <Star
              className={`h-6 w-6 ${
                n <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="How was the approach, the power, the host?"
        className="mt-3 w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-foreground"
      />

      <button
        type="submit"
        disabled={submit.isPending}
        className="mt-3 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {submit.isPending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
