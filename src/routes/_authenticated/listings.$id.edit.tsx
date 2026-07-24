import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ListingForm, type ListingFormValues } from "@/components/listing-form";
import { getPublicListing, updateListing, addListingPhoto } from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing — DockFront" },
      { name: "description", content: "Edit your DockFront listing." },
      { property: "og:title", content: "Edit listing — DockFront" },
      { property: "og:description", content: "Edit your DockFront listing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditListing,
});

type Photo = { name: string; url: string };

function EditListing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "edit", id],
    queryFn: async () => {
      // owner can read own draft via authenticated session in the browser client
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) return;
      const prefix = `${sess.user.id}/${id}`;
      const { data: files } = await supabase.storage.from("listing-photos").list(prefix, { limit: 50 });
      if (files) {
        const items = await Promise.all(
          files.map(async (f) => {
            const { data: signed } = await supabase.storage
              .from("listing-photos")
              .createSignedUrl(`${prefix}/${f.name}`, 3600);
            return { name: `${prefix}/${f.name}`, url: signed?.signedUrl ?? "" };
          }),
        );
        setPhotos(items.filter((i) => i.url));
      }
    }
    load();
  }, [id]);

  async function onUpload(files: FileList) {
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) throw new Error("Not signed in");
      for (const file of Array.from(files)) {
        const path = `${sess.user.id}/${id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
        const { error } = await supabase.storage.from("listing-photos").upload(path, file);
        if (error) throw error;
        const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
        await addListingPhoto({
          data: { listing_id: id, url: pub.publicUrl, is_cover: photos.length === 0 },
        });
        setPhotos((p) => [...p, { name: path, url: pub.publicUrl }]);
      }
      toast.success("Photos uploaded.");
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  if (!data)
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="p-16 text-center">
          <p className="font-serif text-3xl">Listing not found.</p>
        </div>
      </div>
    );

  const initial: ListingFormValues = {
    listing_type: (data.listing_type as ListingFormValues["listing_type"]) ?? (data.kind === "home" ? "home_sale" : "slip_lease"),
    title: data.title,
    description: data.description ?? "",
    price_cents: data.price_cents,
    price_period: data.price_period ?? (data.kind === "home" ? "sale" : "month"),
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    waterway: data.waterway ?? "",
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    sqft: data.sqft,
    lat: data.lat,
    lng: data.lng,
    dock_length_ft: data.dock_length_ft,
    water_depth_ft: data.water_depth_ft,
    max_boat_length_ft: data.max_boat_length_ft,
    max_boat_beam_ft: data.max_boat_beam_ft,
    max_boat_draft_ft: data.max_boat_draft_ft,
    power: data.power ?? "",
    water_hookup: data.water_hookup ?? false,
    covered: data.covered ?? false,
    floating: data.floating ?? false,
    tidal: data.tidal ?? false,
    liveaboard_allowed: data.liveaboard_allowed ?? false,
    contact_email: data.contact_email ?? "",
    contact_phone: data.contact_phone ?? "",
    cover_photo_url: data.cover_photo_url ?? "",
    nightly_price_cents: data.nightly_price_cents,
    weekly_price_cents: data.weekly_price_cents,
    cleaning_fee_cents: data.cleaning_fee_cents ?? 0,
    min_nights: data.min_nights ?? 1,
    max_nights: data.max_nights,
    instant_book: data.instant_book ?? false,
    max_guests: data.max_guests ?? 4,
    status: data.status === "published" ? "published" : "draft",
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">Edit listing</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{data.title}</h1>

        <section className="mt-10">
          <h2 className="mb-3 font-serif text-2xl">Photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <div key={p.name} className="group relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={async () => {
                    await supabase.storage.from("listing-photos").remove([p.name]);
                    setPhotos((prev) => prev.filter((x) => x.name !== p.name));
                  }}
                  className="absolute right-2 top-2 rounded-sm bg-nav/80 p-1.5 text-nav-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground hover:border-teak hover:text-teak">
              {uploading ? "Uploading…" : "+ Add photo"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onUpload(e.target.files)}
              />
            </label>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 font-serif text-2xl">Details</h2>
          <ListingForm
            initial={initial}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              try {
                await updateListing({ data: { ...values, id } });
                toast.success("Saved.");
                qc.invalidateQueries({ queryKey: ["listings"] });
                qc.invalidateQueries({ queryKey: ["my-listings"] });
                if (values.status === "published") navigate({ to: "/listings/$id", params: { id } });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Save failed.");
              }
            }}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
