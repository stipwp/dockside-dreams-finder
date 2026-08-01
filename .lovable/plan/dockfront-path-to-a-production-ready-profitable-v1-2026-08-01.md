# DockFront — path to a production-ready, profitable v1

Goal: an Airbnb-quality dock marketplace that looks alive on day one, converts hosts into paying subscribers, and is safe to put in front of real users. Bookings stay request-to-book (no card payments yet); money comes from host subscriptions and paid featured placement.

## 1. Make it look alive (seed content)

- Seed ~18 demo docks across Río Dulce (Guatemala), Nassau, Split, Phuket, Miami, Bocas del Toro, Tortola, Palma — each with photos, nightly price, boat length/beam/draft limits, depth, power, amenities, coordinates, and availability.
- Every demo listing is flagged as demo so you can delete them all in one click from the dashboard once real hosts arrive.
- Homepage, search, and map all populate from this data, so no empty states at launch.

## 2. Airbnb-grade product polish

- **Listing detail**: 5-photo mosaic gallery with lightbox, sticky booking card with date picker + boat-fit check + live price breakdown, amenities grid, "what your boat needs" specs, map section, host card, cancellation policy.
- **Search**: sticky filter bar, working date range + boat dimensions, map/split/grid toggle with hover-linked pins, "search this area", result count, skeleton loaders, shareable URLs.
- **Saves**: wire the heart to the existing `favorites` table plus a `/wishlists` page (currently the heart is local state only).
- **Reviews**: guests review after a completed stay; star average shows on cards and detail pages (replaces the placeholder "New" badge).
- **Messaging**: in-app thread per booking using the existing `booking_messages` table, so hosts and guests never trade emails.
- **Host onboarding**: multi-step listing wizard (type → location → dock specs → boat limits → photos → pricing → review) instead of one long form.
- **Trust**: verified-email badge, house rules, cancellation policy per listing, report-listing link.
- **Mobile**: full pass on nav, filter sheet, booking bar, map.
- **Empty/loading/error states** everywhere, plus toasts for every action.

## 3. Monetization

- **Host plans**
  - Free: 1 active listing, request-to-book only.
  - Pro (monthly/annual): unlimited listings, instant book, calendar tools, priority support, lower-friction badge.
- **Featured placement**: paid add-on that pins a listing to the top of matching searches and the homepage rail for a set period, clearly labelled "Featured".
- **Captain membership (buyer/guest tier)** — proposed inclusions, adjustable:
  - Early access to newly listed docks before they hit public search.
  - Saved-search alerts (email when a dock matching your boat + dates appears).
  - Unlimited wishlists and price-drop alerts.
  - Priority booking requests (flagged to hosts) and concierge help finding a slip.
  - Member-only rate hints from participating hosts.
- Pricing page comparing the three plans, upgrade prompts at natural moments (second listing, featured slot, saved search).
- Billing itself is a follow-up step: subscriptions need Lovable's built-in payments turned on. I'll build the plan/entitlement model and gating now so switching billing on later is a small change, not a rewrite.

## 4. Production readiness

- Full security scan pass; RLS review on every new table.
- Transactional email: booking request, host accepted/declined, new message, welcome.
- SEO: per-route metadata, destination landing pages (Río Dulce, Nassau, Split, Phuket, Miami) for organic traffic, sitemap already dynamic.
- Analytics events on search, listing view, booking request, signup, upgrade.
- Legal pages: terms, privacy, host agreement, cancellation policy.
- Performance: lazy images, map code-split, LCP preload on the hero.
- Support surface: help center page + contact routing.

## Technical notes

- New tables: `reviews`, `saved_searches`, `plans`/`subscriptions` (entitlement fields: plan tier, status, current period end), `featured_placements`, plus an `is_demo` flag on `listings`. Each with GRANTs and RLS scoped to `auth.uid()`.
- Entitlement checks live in a server function (`getMyEntitlements`) and gate listing count, instant book, and featured purchase — never trusted from the client.
- Search ranking: featured first, then availability match, then recency.
- Reviews aggregate via a view or trigger-maintained rating columns on `listings` so cards stay cheap to render.
- Demo data seeded through a migration with literal INSERTs so it exists on first load.

## Suggested order

1. Seed data + listing detail redesign + saves/wishlists
2. Reviews + messaging + host onboarding wizard
3. Plans, entitlements, featured placement, pricing page
4. Emails, legal, SEO landing pages, analytics, security scan
5. Turn on billing and connect subscriptions
