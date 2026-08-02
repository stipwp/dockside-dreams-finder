# DockFront — what it takes to compete and ship

You already have the marketplace core: listings, search + map, availability, a full booking request flow with messaging, reviews, wishlists, host dashboard, plans/entitlements, legal pages, SEO. What's missing is everything that turns a working demo into a business: money movement, notifications, trust, moderation, and measurement.

Verified gaps in the project today: no payments integration, no email/notification sending, no analytics, no admin/moderation surface, no ID or listing verification.

## Tier 1 — Blockers for real users (must-have)

1. **Payments end to end.** Turn on Lovable's built-in Stripe payments. Guests pay when a host accepts (or instantly for Instant Book), funds route to the host via Stripe Connect, DockFront keeps a service fee. Needs: payouts onboarding for hosts, payment intents tied to bookings, refunds driven by the cancellation policy, receipts, and a webhook that is the single source of truth for booking status.
2. **Host subscriptions billing.** Wire Host Pro / Captain to real Stripe subscriptions so the entitlement model already in place starts charging. Same for paid featured placement.
3. **Transactional email.** Booking requested, accepted, declined, cancelled, payment receipt, new message, review reminder, welcome, password reset — sent from a verified DockFront domain with branded templates.
4. **Cancellation and refund policy engine.** Flexible / Moderate / Strict per listing, enforced server-side with the exact refund math shown to the guest before they confirm.
5. **Double-booking protection.** Accepting a booking must atomically block the dates; concurrent requests for the same nights must fail cleanly.

## Tier 2 — Trust and safety (what makes a marketplace credible)

6. **Identity verification** for hosts and guests, with a verified badge; block payouts until a host is verified.
7. **Admin console**: review and approve new listings, suspend users, resolve disputes, refund manually, view flagged content, delete demo data.
8. **Reporting and moderation**: report listing / report user / report message, plus profanity and contact-info stripping in messages so people can't take deals off-platform.
9. **Insurance and liability copy**: host agreement, damage policy, what DockFront does and doesn't cover. Real marinas will ask.
10. **Dispute flow**: guest can open a case within X days; funds held until resolved.

## Tier 3 — Competitive product depth

11. **Host calendar tooling**: iCal import/export (sync with Dockwa/Marinalife/Google), seasonal and weekend pricing, length-of-stay discounts, blocked dates in bulk.
12. **Boat-fit matching**: guests save their boat profile (LOA, beam, draft, air draft, power need) once; search auto-filters to docks that actually fit and flags "your boat won't clear this depth at low tide."
13. **Local intel per listing**: tides, approach depth, fuel/pumpout nearby, hurricane season notes, customs/check-in info for international spots (Río Dulce, Bocas, Nassau).
14. **Instant Book with rules** (auto-accept if boat fits, guest is verified, dates open).
15. **Guest and host profiles** with review history both directions (hosts review guests).
16. **Notifications center** in-app + email digest + optional SMS for booking requests.
17. **Multi-currency and locale** pricing display — you're global by design.
18. **Mobile-first pass** and installable PWA; most boaters search from a phone at the helm.

## Tier 4 — Growth and being found

19. **Supply-side acquisition**: bulk listing import for marinas, a referral program, "claim your dock" pages seeded from public marina data.
20. **Destination landing pages** per region with real content, plus a blog/cruising-guide section for organic search.
21. **Analytics and funnel tracking**: search → listing view → request → accept → paid, with conversion dashboards.
22. **Lifecycle email**: abandoned search, price drops on saved docks, host re-engagement, seasonal campaigns.
23. **Social proof**: press page, host testimonials, trust stats on the homepage.

## Tier 5 — Operational readiness

24. **Security scan pass** with RLS review on every table, rate limiting on public endpoints, and secrets audit.
25. **Error monitoring and uptime alerts**; structured logging on payment and booking paths.
26. **Automated test coverage** on the booking state machine, pricing math, and refund math.
27. **Performance**: image CDN and responsive sizes, map code-split, LCP under 2.5s.
28. **Legal**: terms, privacy, host agreement, cookie consent (GDPR for EU listings), tax reporting (1099-K for US hosts), accessibility (WCAG AA).
29. **Support**: help center with real articles, contact routing, SLA, and a status page.

## Recommended build order

1. Payments + payouts + refunds (nothing else matters until money moves)
2. Transactional email + notifications
3. Trust: verification, admin console, reporting, disputes
4. Host calendar tooling + boat-fit matching + Instant Book rules
5. Analytics, growth pages, lifecycle email
6. Hardening: tests, monitoring, performance, legal, support

## Technical notes

- Payments via Lovable's built-in Stripe integration; Stripe Connect Express for host payouts. Booking status transitions driven by a `/api/public/stripe-webhook` server route with signature verification — never by the client.
- New tables: `payments`, `payouts`, `disputes`, `reports`, `verifications`, `notifications`, `boat_profiles`, `pricing_rules`, `ical_feeds`, `admin_audit_log` — each with GRANTs and RLS scoped to `auth.uid()`, admin access via the existing `has_role` function.
- Double-booking prevented with a DB-level exclusion constraint on (listing_id, date range) for accepted bookings.
- Email via Lovable Email on a verified custom domain with React-rendered templates.
- iCal sync as a scheduled server route pulling feeds; conflicts surfaced to the host rather than auto-resolved.
- Admin console lives under `/_authenticated/admin` gated by `has_role(auth.uid(), 'admin')` checked server-side.

## What I'd need from you before starting

- A Stripe account (or approval to run the Stripe setup flow) and the service-fee percentage you want to charge.
- A domain for sending email, and confirmation of your business/legal entity name for terms and the host agreement.
- Whether v1 charges guests at booking or at acceptance.
