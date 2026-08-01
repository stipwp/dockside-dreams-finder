import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { id: string; url: string };

/** Full-screen photo viewer with keyboard + arrow navigation. */
export function PhotoLightbox({
  photos,
  index,
  title,
  onClose,
  onIndexChange,
}: {
  photos: LightboxPhoto[];
  index: number;
  title: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const count = photos.length;
  const prev = useCallback(() => onIndexChange((index - 1 + count) % count), [index, count, onIndexChange]);
  const next = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  if (!count) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      className="fixed inset-0 z-50 flex flex-col bg-foreground/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between p-4 text-background">
        <button
          onClick={onClose}
          aria-label="Close photos"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-background/15"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">
          {index + 1} / {count}
        </span>
        <span className="h-10 w-10" />
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        {count > 1 && (
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-card transition-transform hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <img
          src={photos[index].url}
          alt={`${title} — photo ${index + 1} of ${count}`}
          className="max-h-full max-w-full rounded-xl object-contain"
        />
        {count > 1 && (
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-card transition-transform hover:scale-105"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-5">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onIndexChange(i)}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === index}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition-opacity ${
                i === index ? "ring-background" : "opacity-60 ring-transparent hover:opacity-100"
              }`}
            >
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
