
## DockFront — FSBO Waterfront Homes & Dock Slips

A For-Sale-By-Owner marketplace for boat owners. Two listing types:
1. **Waterfront homes with private docks** (for sale)
2. **Dock slips for rent/lease** (private owners renting slips)

Visual + structural inspiration: internationalsurfproperties.com — dark navigation bar, full-bleed hero photo, centered wordmark, prominent search block overlaid on hero, "Featured Listings" carousel, tiled destination/region grid, footer with contact + list-your-property CTA. We reinterpret the aesthetic for a nautical/marine feel (deep navy + weathered teak/rope accents, crisp white, a dockside hero photo instead of a surfer).

---

### Pages & routes

```
/                       Home (hero + search + featured + regions + how it works)
/listings               Browse (filters: type, price, beds, dock length, water depth, region)
/listings/$id           Listing detail (gallery, specs, dock specs, map, contact owner)
/map                    Map search view
/list-your-property     Marketing page + CTA to auth/dashboard
/how-it-works           FSBO explainer
/about                  About
/contact                Contact
/auth                   Sign in / sign up (email+password + Google)
/_authenticated/dashboard      Owner dashboard (my listings)
/_authenticated/listings/new   Create listing wizard
/_authenticated/listings/$id/edit
/_authenticated/messages       Inquiries inbox
/_authenticated/favorites      Saved listings
```

Every route gets its own `head()` with unique title/description/OG tags.

---

### Design direction

- **Palette**: deep navy `#0B1F33`, weathered teak `#B08256`, foam white `#F7F5EF`, buoy red accent `#D9482B`, muted seafoam `#7FA9A4`. Defined as oklch tokens in `src/styles.css`.
- **Typography**: display serif for headlines (Cormorant / Instrument Serif vibe), clean sans (Work Sans / Inter) for UI/body. Loaded via `<link>` in `__root.tsx`.
- **Layout DNA from reference**: dark top nav with right-side "LIST YOUR PROPERTY" pill button; full-bleed hero image; centered oversized headline in a thin outlined box; overlaid search card with dropdown filters + price range slider; alternating full-width bands below; featured-listing carousel with badge chips ("FEATURED", "FOR SALE", "FOR RENT", "NEW"); regions/waterways grid; footer with big brand mark.
- Nautical imagery generated for hero, region tiles, and featured placeholders.

---

### Data model (Lovable Cloud / Supabase)

```
profiles(id → auth.users, full_name, phone, avatar_url, created_at)
user_roles(user_id, role: 'owner'|'admin')      -- separate table, has_role() SECURITY DEFINER
listings(
  id, owner_id → auth.users, kind: 'home'|'slip',
  title, description, status: 'draft'|'published'|'sold_rented',
  price_cents, price_period: 'sale'|'month'|'season',   -- period null for homes
  address, city, state, country, lat, lng, waterway,
  bedrooms, bathrooms, sqft, lot_sqft,                  -- home fields
  dock_length_ft, dock_beam_ft, water_depth_ft,
  max_boat_length_ft, power, water_hookup, liveaboard_allowed,
  covered, floating, tidal,
  featured, created_at, updated_at
)
listing_photos(id, listing_id, url, sort_order, is_cover)
favorites(user_id, listing_id, created_at)
inquiries(id, listing_id, from_user_id, message, contact_email, contact_phone, created_at, read_at)
```

RLS:
- `listings`: public SELECT where `status='published'`; owner SELECT/INSERT/UPDATE/DELETE on own rows.
- `listing_photos`: public SELECT for photos of published listings; owner CRUD on own.
- `favorites`, `inquiries`: user scoped by `auth.uid()`.
- Storage bucket `listing-photos` (public read, authenticated write scoped by owner path).

Grants + `GRANT`s to `anon`/`authenticated` per public-schema rules.

---

### Auth

- Lovable Cloud email/password + Google sign-in (via `lovable.auth.signInWithOAuth`).
- `profiles` auto-created via trigger on signup.
- Protected owner routes under `src/routes/_authenticated/`.

---

### Server functions (`src/lib/*.functions.ts`)

- `listPublicListings` (filters, pagination) — public, server publishable client
- `getPublicListing(id)` — public
- `listMyListings`, `createListing`, `updateListing`, `deleteListing`, `publishListing` — `requireSupabaseAuth`
- `uploadListingPhoto` (signed URL flow) — auth
- `toggleFavorite`, `listFavorites` — auth
- `sendInquiry` — public (rate-limited); `listInquiries` — auth (owner)

---

### Build order

1. Enable Lovable Cloud; add design tokens + fonts; build root layout + dark marine nav + footer.
2. Home page: hero, search bar, featured carousel, regions grid, how-it-works strip, CTA band.
3. Migrations: profiles, user_roles + has_role, listings, listing_photos, favorites, inquiries, storage bucket, RLS + grants, signup trigger.
4. Public browse: `/listings` grid with filters + `/listings/$id` detail page with gallery, spec table, dock specs card, contact-owner form.
5. `/map` view (Leaflet via ClientOnly + React.lazy).
6. Auth pages + Google sign-in + `_authenticated` gate.
7. Owner dashboard + create/edit listing wizard with photo upload.
8. Favorites + inquiries inbox.
9. Static pages: how-it-works, about, contact, list-your-property.
10. SEO polish: per-route `head()`, sitemap-friendly slugs, JSON-LD for listings, OG images from cover photo.

---

### Notes / assumptions

- Payments not included (FSBO — owners transact directly). Can add featured-listing upsell later via Stripe.
- Map uses OpenStreetMap tiles (no key). Mapbox can be swapped in later if desired.
- Messaging is inquiry-form → owner email + in-app inbox. Full realtime chat can come later.

Approve to build, or tell me what to adjust (scope cuts, extra listing types, different palette, payments for featured listings, etc.).
