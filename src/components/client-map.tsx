import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";

const LazyMap = lazy(() => import("./listings-map"));

export function ClientMap(props: ComponentProps<typeof LazyMap>) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Loading map…
        </div>
      }
    >
      <LazyMap {...props} />
    </Suspense>
  );
}
