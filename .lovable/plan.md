
# DockFront → Airbnb + Zillow hybrid

Turn the site into a two-mode marketplace:

- **Zillow mode** — waterfront homes for sale (FSBO) and long-term dock leases (existing).
- **Airbnb mode** — short-term nightly/weekly dock rentals with a real availability calendar, date search, booking requests, and host accept/decline.

Payments stay off for now (contact/booking only). Stripe Connect can be added in a later pass.

## 1. Data model additions

New `listing_type` dimension on `listings`:
- `home_sale` — waterfront home for sale
- `slip_lease` — long-term dock lease (existing "slip")
- `slip_short_term` — nightly/weekly dock rental (new)

Add columns to `listings` for short-term:
- `nightly_price_cents`, `weekly_price_cents`, `cleaning_fee_cents`
- `min_nights`, `max_nights`, `advance_notice_hours`, `instant_book` (bool)
- Boat-fit specs already exist (length, beam, depth, power) — reuse.

New tables:
- **`listing_availability`** — per-day blocks/unblocks and price overrides (`listing_id`, `date`, `is_blocked`, `price_cents_override`). Owner-managed.
- **`bookings`** — guest reservations: `listing_id`, `guest_id`, `start_date`, `end_date`, `guests`, `boat_length_ft`, `boat_beam_ft`, `boat_draft_ft`, `boat_name`, `total_cents`, `status` (`pending` | `accepted` | `declined` | `cancelled` | `expired`), `message`.
- **`booking_messages`** — thread per booking between guest and host.

RLS:
- `listing_availability`: public SELECT for published listings; owner full write.
- `bookings`: guest sees own; host sees bookings on own listings; both can update status per role (host accept/decline, guest cancel).
- `booking_messages`: participants only.

All new public tables get GRANTs; owner-write paths use `requireSupabaseAuth`.

## 2. Server functions

- `searchShortTermSlips({ where, start, end, boat_length, boat_beam, boat_draft, guests })` — filters by lat/lng bbox + boat-fit + availability (no blocked days, no overlapping accepted bookings in range).
- `getListingAvailability(listing_id, month)` — calendar data for guest date-picker.
- `createBookingRequest(...)` — guest submits; server validates dates free, boat fits, price = sum(nightly per day) + cleaning. Auto-accept when `instant_book`.
- `respondToBooking(booking_id, accept|decline, note)` — host only.
- `cancelBooking(booking_id)` — guest or host.
- `listMyBookings()` / `listMyHostBookings()` — dashboards.
- `setAvailability(listing_id, dates[], is_blocked, price_override?)` — host calendar edits.
- `sendBookingMessage(booking_id, body)` / `listBookingMessages(booking_id)`.

## 3. Routes & UI

**Home page** — split hero into two entry modes (Zillow-style search on left, Airbnb-style on right):
- "Buy a waterfront home / lease a slip" → `/listings` (existing).
- "Find a dock for your boat" → `/rent` with where + dates + boat dimensions + guests.

**New public routes**
- `/rent` — Airbnb-style search: location, check-in/out date range, boat length/beam/draft, guest count. Grid + map results. Uses `searchShortTermSlips`.
- `/rent/$id` — short-term slip detail: photo gallery, boat-fit specs, availability calendar (react-day-picker), price breakdown, "Request to book" / "Book instantly" panel, host card.

**Existing routes**
- `/listings` and `/listings/$id` — extended with `listing_type=home_sale|slip_lease` filter and updated card badges. Long-term leases route here.

**Owner (`_authenticated`)**
- `/dashboard` — tabs: My Listings, My Bookings (as host), My Trips (as guest).
- `/listings/new` and `/listings/$id/edit` — add "Listing type" picker; when `slip_short_term`, reveal nightly/weekly/cleaning/min-max nights/instant-book fields.
- `/listings/$id/calendar` — month calendar to block dates and set price overrides.
- `/bookings/$id` — booking detail + message thread + accept/decline/cancel actions.

## 4. Components

- `RentSearchBar` — where + date range + boat dims + guests, drives `/rent` search params.
- `AvailabilityCalendar` (guest, read-only + selectable range) and `HostAvailabilityCalendar` (multi-select block/unblock).
- `BookingRequestPanel` — price breakdown, boat-fit warnings, submit.
- `BookingCard` + `BookingStatusBadge` — dashboards.
- `MessageThread` — booking messages.
- Reuse `ClientMap` for `/rent` results.

## 5. Search params (all URL-driven)

`/rent` schema (via `fallback()` from `@tanstack/zod-adapter`):
`where`, `start`, `end` (ISO), `boat_length`, `boat_beam`, `boat_draft`, `guests`, `instant`, `view` (grid|map).

## 6. Nav & polish

- SiteNav: add "Rent a dock" and "Buy / Lease" primary links; keep "List your property".
- List-your-property page updated with three cards: sell home, lease slip long-term, host slip short-term.
- SEO head() on every new route with unique title/description/OG.

## 7. Out of scope for this pass

Stripe Connect payouts, guest checkout, reviews/ratings, host onboarding KYC. Structure booking table so payments can bolt on later (`status='accepted' → 'paid'` transition + `payment_intent_id` column reserved).

## Technical notes (for the implementer)

- Migrations run in one batch per Lovable Cloud rules (CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY).
- Overlap check in `createBookingRequest` uses `tstzrange` overlap against accepted bookings; also block `listing_availability.is_blocked=true` days.
- `nightly_price_cents` lives on `listings`; per-day overrides live on `listing_availability`. Total = Σ(override ?? nightly) + cleaning_fee.
- Public `searchShortTermSlips` runs on the server publishable client (anon-safe columns only, no owner contact fields).
- Bookings + messages fetchers use `requireSupabaseAuth`; called from `_authenticated` loaders or components via `useServerFn`.
- Availability calendar UI: use existing shadcn `Calendar` (react-day-picker) with `mode="range"` on guest side and `mode="multiple"` on host side; add `pointer-events-auto`.
- Keep existing PostgREST-injection-safe query sanitizer on any `.or()` search inputs added to `/rent`.
