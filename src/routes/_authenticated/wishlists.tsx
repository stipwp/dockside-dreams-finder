import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { DockCard } from "@/components/dock-card";
import { listMyFavorites } from "@/lib/account.functions";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wishlists")({
  head: () => ({
    meta: [
      { title: "Your dock wishlist — DockFront" },
      { name: "description", content: "Docks you saved while planning your next passage." },
      { property: "og:title", content: "Your dock wishlist — DockFront" },
      { property: "og:description", content: "Docks you saved while planning your next passage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wishlists,
});

function Wishlists() {
  const fetchFavorites = useServerFn(listMyFavorites);
  const { data, isLoading } = useQuery({ queryKey: ["favorites", "mine"], queryFn: () => fetchFavorites() });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[100rem] px-4 py-10 md:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Wishlist</h1>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading your saved docks…</p>
        ) : data && data.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-5">
            {data.map((l) => (
              <DockCard key={l.id} l={l} compact />
            ))}
          </div>
        ) : (
          <div className="mt-16 max-w-md">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-xl font-bold">Nothing saved yet</p>
            <p className="mt-2 text-muted-foreground">
              Tap the heart on any dock to keep it here while you plan your route.
            </p>
            <Link
              to="/rent"
              className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Find a dock
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
