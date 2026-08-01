import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getListingAvailability } from "@/lib/bookings.functions";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function addDays(isoDate: string, n: number) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Airbnb-style availability calendar. Blocked nights come from the host calendar + existing bookings. */
export function AvailabilityCalendar({
  listingId,
  start,
  end,
  onChange,
}: {
  listingId: string;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const from = iso(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const to = iso(new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0));

  const { data } = useQuery({
    queryKey: ["availability", listingId, from, to],
    queryFn: () => getListingAvailability({ data: { listing_id: listingId, from, to } }),
    staleTime: 60_000,
  });

  const blocked = useMemo(() => {
    const set = new Set<string>();
    for (const a of data?.availability ?? []) if (a.is_blocked) set.add(a.date);
    for (const b of data?.bookings ?? []) {
      let d = b.start_date;
      while (d < b.end_date) {
        set.add(d);
        d = addDays(d, 1);
      }
    }
    return set;
  }, [data]);

  const todayIso = iso(today);

  function pick(day: string) {
    if (!start || (start && end) || day <= start) {
      onChange(day, "");
      return;
    }
    // reject ranges that cross a blocked night
    let d = start;
    while (d < day) {
      if (blocked.has(d)) {
        onChange(day, "");
        return;
      }
      d = addDays(d, 1);
    }
    onChange(start, day);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={iso(cursor) <= iso(new Date(today.getFullYear(), today.getMonth(), 1))}
          onClick={() => setCursor((c) => addMonths(c, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          <span className="hidden sm:inline">
            {" · "}
            {addMonths(cursor, 1).toLocaleDateString(undefined, { month: "long" })}
          </span>
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        {[0, 1].map((offset) => (
          <Month
            key={offset}
            month={addMonths(cursor, offset)}
            blocked={blocked}
            todayIso={todayIso}
            start={start}
            end={end}
            onPick={pick}
            hideOnMobile={offset === 1}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted line-through">&nbsp;</span> Unavailable
        </span>
        {start && (
          <button type="button" onClick={() => onChange("", "")} className="font-semibold text-foreground underline">
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}

function Month({
  month,
  blocked,
  todayIso,
  start,
  end,
  onPick,
  hideOnMobile,
}: {
  month: Date;
  blocked: Set<string>;
  todayIso: string;
  start: string;
  end: string;
  onPick: (d: string) => void;
  hideOnMobile?: boolean;
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return (
    <div className={hideOnMobile ? "hidden sm:block" : ""}>
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
        {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
        {DAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <span key={`p${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const date = iso(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const past = date < todayIso;
          const isBlocked = blocked.has(date);
          const disabled = past || isBlocked;
          const selected = date === start || date === end;
          const inRange = !!start && !!end && date > start && date < end;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onPick(date)}
              aria-label={date}
              aria-pressed={selected}
              className={`h-9 rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-primary font-bold text-primary-foreground"
                  : inRange
                    ? "bg-primary/10 font-semibold"
                    : disabled
                      ? "text-muted-foreground/50 line-through"
                      : "hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
