import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListingForm } from "@/components/listing-form";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { createListing } from "@/lib/listings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/listings/new")({
  head: () => ({
    meta: [
      { title: "New listing — DockFront" },
      { name: "description", content: "Create a new waterfront property or dock slip listing." },
      { property: "og:title", content: "New listing — DockFront" },
      { property: "og:description", content: "List a waterfront property." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewListing,
});

function NewListing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">
          New listing
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">List your property</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Fill in the essentials — you can add photos and refine details next.
        </p>
        <div className="mt-10">
          <ListingForm
            onSubmit={async (values) => {
              try {
                const res = await createListing({ data: values });
                toast.success("Listing created.");
                navigate({ to: "/listings/$id/edit", params: { id: res.id } });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to create listing.");
              }
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
