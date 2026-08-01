-- 1. Listing extensions
ALTER TABLE public.listings
  ALTER COLUMN owner_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS house_rules text,
  ADD COLUMN IF NOT EXISTS cancellation_policy text NOT NULL DEFAULT 'moderate';

CREATE INDEX IF NOT EXISTS listings_is_demo_idx ON public.listings (is_demo);

-- 2. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews readable for published listings" ON public.reviews
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = reviews.listing_id AND l.status = 'published'));
CREATE POLICY "Guests review their completed bookings" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = reviews.booking_id
        AND b.guest_id = auth.uid()
        AND b.listing_id = reviews.listing_id
        AND b.status = 'accepted'
        AND b.end_date <= current_date
    )
  );
CREATE POLICY "Reviewers update own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers delete own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = reviewer_id);

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_listing_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE lid uuid;
BEGIN
  lid := COALESCE(NEW.listing_id, OLD.listing_id);
  UPDATE public.listings l
     SET rating_avg = sub.avg_rating,
         rating_count = sub.cnt
    FROM (SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS cnt
            FROM public.reviews WHERE listing_id = lid) sub
   WHERE l.id = lid;
  RETURN NULL;
END; $$;

CREATE TRIGGER reviews_refresh_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_listing_rating();

-- 3. Saved searches
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  alerts_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER saved_searches_set_updated_at BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Subscriptions / entitlements
DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'host_pro', 'captain');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.plan_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  interval text NOT NULL DEFAULT 'month',
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tier)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Featured placements
CREATE TABLE IF NOT EXISTS public.featured_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  provider_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_placements TO anon;
GRANT SELECT ON public.featured_placements TO authenticated;
GRANT ALL ON public.featured_placements TO service_role;
ALTER TABLE public.featured_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Featured placements readable" ON public.featured_placements
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = featured_placements.listing_id AND l.status = 'published'));
CREATE TRIGGER featured_placements_set_updated_at BEFORE UPDATE ON public.featured_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Entitlement helper
CREATE OR REPLACE FUNCTION public.current_tier(_user_id uuid)
RETURNS public.plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT s.tier FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.status IN ('active','trialing')
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
      ORDER BY CASE s.tier WHEN 'host_pro' THEN 1 WHEN 'captain' THEN 2 ELSE 3 END
      LIMIT 1),
    'free'::public.plan_tier);
$$;
REVOKE EXECUTE ON FUNCTION public.current_tier(uuid) FROM anon;

-- 7. Demo dock listings
INSERT INTO public.listings (
  owner_id, kind, status, listing_type, is_demo, featured, title, description,
  price_cents, nightly_price_cents, weekly_price_cents, cleaning_fee_cents, min_nights, instant_book,
  address, city, state, country, waterway, lat, lng, cover_photo_url,
  dock_length_ft, water_depth_ft, max_boat_length_ft, max_boat_beam_ft, max_boat_draft_ft, max_guests,
  power, water_hookup, covered, floating, liveaboard_allowed, house_rules, cancellation_policy
) VALUES
(NULL,'slip','published','slip_short_term',true,true,'Private jungle dock on the Río Dulce','Deep, protected water on the Río Dulce with a private hardwood dock. Step ashore to a shaded palapa, fresh water, and a caretaker on site. Ten minutes by dinghy to Fronteras.',6500,6500,39000,2500,2,true,NULL,'Río Dulce','Izabal','GT','Río Dulce',15.6650,-88.9950,'/__l5e/assets-v1/8e99b338-32dc-44bc-8f61-806c974cb80f/dock-01.jpg',60,12,55,18,7,6,'30A/50A',true,false,true,true,'No fuel transfers at the dock. Quiet hours after 10pm.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Sheltered mangrove berth near Fronteras','Hurricane-hole calm year round. Solid pilings, easy stern-to approach, and a short walk to the market.',4200,4200,25000,1500,1,true,NULL,'Río Dulce','Izabal','GT','Río Dulce',15.6600,-88.9900,'/__l5e/assets-v1/b5769a02-7890-4415-9c1a-23b63a72f916/dest-riodulce.jpg',45,9,45,16,6,4,'30A',true,false,true,true,'No liveaboard pets over 40lb.','flexible'),
(NULL,'slip','published','slip_short_term',true,true,'Turquoise-water slip, Nassau harbour','Concrete slip with 50A shore power and city water, minutes from downtown Nassau. Clean, well-lit, and monitored 24/7.',12500,12500,75000,4000,2,true,NULL,'Nassau','New Providence','BS','Nassau Harbour',25.0780,-77.3390,'/__l5e/assets-v1/7e87da3a-4374-473a-b292-7b861bbf6cb8/dock-02.jpg',70,10,65,20,6,8,'50A',true,false,false,false,'No overnight generator use.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Paradise Island private dock','Quiet residential dock on the north side with easy access to the cut. Great for a two-night stopover.',9800,9800,58000,3500,1,false,NULL,'Nassau','New Providence','BS','Nassau Harbour',25.0840,-77.3200,'/__l5e/assets-v1/b105104e-1533-4ebc-9c1d-b51c1b5dc88a/dest-bahamas.jpg',55,8,50,17,5,6,'30A/50A',true,false,false,false,'Guests only, no day visitors.','strict'),
(NULL,'slip','published','slip_short_term',true,true,'Old town quay berth, Split','Stern-to berth on a stone quay steps from Diocletian''s Palace. Lazy lines, water, and power on the pier.',14500,14500,87000,4500,2,false,NULL,'Split','Split-Dalmatia','HR','Adriatic Sea',43.5040,16.4400,'/__l5e/assets-v1/9ccf8933-52f3-42c6-8fe5-0636a8a70a65/dock-03.jpg',60,13,52,16,8,8,'32A',true,false,false,false,'Med-mooring experience recommended.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Quiet Dalmatian island mooring','Village pier on a nearby island — calm, cheap, and utterly quiet after the day boats leave.',7500,7500,45000,2000,1,true,NULL,'Split','Split-Dalmatia','HR','Adriatic Sea',43.3900,16.3100,'/__l5e/assets-v1/ac0dd359-4221-4188-8c5f-b64e24679643/dest-croatia.jpg',40,10,40,14,6,4,'16A',true,false,false,false,'No amplified music.','flexible'),
(NULL,'slip','published','slip_short_term',true,true,'Covered lift dock, Miami intracoastal','Private covered slip behind a waterfront home on the ICW. Boat lift available, fresh water, and gated parking.',11000,11000,66000,4000,2,true,NULL,'Miami','FL','US','Intracoastal Waterway',25.8100,-80.1250,'/__l5e/assets-v1/41eaa775-611e-4fc9-b3c7-ec096b5c5a1c/dock-04.jpg',50,7,48,15,4,6,'30A/50A',true,true,true,false,'No fishing from the dock.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Coconut Grove floating dock','Floating dock in a protected basin, walkable to the Grove. Perfect for a weekend on the hook without the hook.',8900,8900,53000,3000,1,true,NULL,'Miami','FL','US','Biscayne Bay',25.7280,-80.2400,'/__l5e/assets-v1/03a5b2ef-a938-4468-85a4-3345a2fbfc77/region-florida.jpg',45,6,42,14,4,6,'30A',true,false,true,false,'Quiet hours 11pm-7am.','flexible'),
(NULL,'slip','published','slip_short_term',true,true,'Bamboo jetty, Phuket east coast','Private jetty on emerald water with a tender float and a beach bar next door. Deep enough at all tides.',7900,7900,47000,2500,2,true,NULL,'Phuket','Phuket','TH','Andaman Sea',7.9500,98.4000,'/__l5e/assets-v1/47f7b7c4-2b4a-4700-bebf-ee4e9c0dda99/dock-05.jpg',55,11,50,22,6,8,'32A',true,false,true,true,'Respect the local fishing lines at dawn.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Phang Nga bay mooring & tender dock','Base for exploring the karsts. Mooring ball plus dock access for your tender and fresh water refills.',5200,5200,31000,1500,1,false,NULL,'Phuket','Phang Nga','TH','Phang Nga Bay',8.2700,98.5000,'/__l5e/assets-v1/f48c67a1-f326-4571-b44d-bae81dc5fac1/dest-thailand.jpg',35,14,60,24,7,10,'None',true,false,true,true,'Pack out all trash.','flexible'),
(NULL,'slip','published','slip_short_term',true,false,'Bocas del Toro over-water dock','Palm-shaded dock in flat water off Isla Colón. Kayaks included, snorkelling right off the ladder.',6800,6800,40000,2000,2,true,NULL,'Bocas del Toro','Bocas del Toro','PA','Caribbean Sea',9.3400,-82.2400,'/__l5e/assets-v1/2e784b3d-ce04-4ce5-b531-c6f069c1dc33/dock-06.jpg',50,9,48,20,5,6,'30A',true,false,true,true,'No jet skis after sunset.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Red Frog side private berth','Quiet berth on the far side of the island, deep and protected from the swell.',5900,5900,35000,1800,1,false,NULL,'Bocas del Toro','Bocas del Toro','PA','Caribbean Sea',9.3300,-82.2000,'/__l5e/assets-v1/8e99b338-32dc-44bc-8f61-806c974cb80f/dock-01.jpg',42,8,44,16,5,4,'30A',true,false,true,true,'Dinghy ashore only after dark.','flexible'),
(NULL,'slip','published','slip_short_term',true,true,'Tortola charter-base slip','Wide, easy-in slip sized for catamarans. Ice, water, power and provisioning within walking distance.',13500,13500,81000,4500,2,true,NULL,'Road Town','Tortola','VG','Sir Francis Drake Channel',18.4200,-64.6200,'/__l5e/assets-v1/7e87da3a-4374-473a-b292-7b861bbf6cb8/dock-02.jpg',65,11,60,28,6,10,'50A',true,false,false,false,'Fenders required on both sides.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Cane Garden Bay mooring dock','Steps from the beach bars, calm in the prevailing trades.',7200,7200,43000,2000,1,true,NULL,'Cane Garden Bay','Tortola','VG','Caribbean Sea',18.4300,-64.6600,'/__l5e/assets-v1/b105104e-1533-4ebc-9c1d-b51c1b5dc88a/dest-bahamas.jpg',45,9,46,18,5,6,'30A',true,false,true,false,'No overnight parties on the dock.','flexible'),
(NULL,'slip','published','slip_short_term',true,false,'Palma marina finger pier','Finger pier in a well-run Palma basin — showers, laundry and the old town a short ride away.',15500,15500,93000,5000,2,false,NULL,'Palma','Mallorca','ES','Bay of Palma',39.5600,2.6300,'/__l5e/assets-v1/9ccf8933-52f3-42c6-8fe5-0636a8a70a65/dock-03.jpg',70,14,65,20,8,8,'63A',true,false,false,false,'Marina rules apply; check in at the office.','strict'),
(NULL,'slip','published','slip_short_term',true,false,'Andratx quiet berth','Small, sheltered berth on the west coast for boats up to 45 feet.',9600,9600,57000,3000,1,true,NULL,'Port d''Andratx','Mallorca','ES','Mediterranean Sea',39.5450,2.3830,'/__l5e/assets-v1/ac0dd359-4221-4188-8c5f-b64e24679643/dest-croatia.jpg',48,12,45,15,7,6,'32A',true,false,false,false,'No dinghy storage on the pier.','moderate'),
(NULL,'slip','published','slip_short_term',true,false,'Key Largo sunset dock','Wide, easy dock in a canal off Blackwater Sound. Fish-cleaning station and ice on site.',7400,7400,44000,2500,1,true,NULL,'Key Largo','FL','US','Florida Bay',25.0900,-80.4400,'/__l5e/assets-v1/2e784b3d-ce04-4ce5-b531-c6f069c1dc33/dock-06.jpg',44,5,42,14,3,6,'30A',true,false,true,false,'Shallow at low tide — check your draft.','flexible'),
(NULL,'slip','published','slip_short_term',true,false,'Fort Lauderdale deep-water dock','Straight shot to Port Everglades inlet. 100 feet of concrete seawall dockage with 50A power.',18500,18500,111000,6000,3,false,NULL,'Fort Lauderdale','FL','US','Intracoastal Waterway',26.1200,-80.1050,'/__l5e/assets-v1/41eaa775-611e-4fc9-b3c7-ec096b5c5a1c/dock-04.jpg',100,10,95,24,7,12,'50A/100A',true,false,false,true,'Crew welcome; no commercial charters.','strict');

-- 8. Demo photos
INSERT INTO public.listing_photos (listing_id, url, sort_order, is_cover)
SELECT l.id, l.cover_photo_url, 0, true FROM public.listings l WHERE l.is_demo;

INSERT INTO public.listing_photos (listing_id, url, sort_order, is_cover)
SELECT l.id, p.url, p.ord, false
FROM public.listings l
CROSS JOIN LATERAL (VALUES
  ('/__l5e/assets-v1/8e99b338-32dc-44bc-8f61-806c974cb80f/dock-01.jpg', 1),
  ('/__l5e/assets-v1/2e784b3d-ce04-4ce5-b531-c6f069c1dc33/dock-06.jpg', 2),
  ('/__l5e/assets-v1/47f7b7c4-2b4a-4700-bebf-ee4e9c0dda99/dock-05.jpg', 3),
  ('/__l5e/assets-v1/7e87da3a-4374-473a-b292-7b861bbf6cb8/dock-02.jpg', 4)
) AS p(url, ord)
WHERE l.is_demo AND p.url IS DISTINCT FROM l.cover_photo_url;

-- 9. Demo reviews
INSERT INTO public.reviews (listing_id, reviewer_name, rating, body, is_demo, created_at)
SELECT l.id, r.name, r.rating, r.body, true, now() - (r.ord || ' days')::interval
FROM public.listings l
CROSS JOIN LATERAL (VALUES
  ('Marta R.', 5, 'Easy approach, solid cleats and the depth was exactly as listed. Would come back.', 12),
  ('Jonas K.', 5, 'Host answered within minutes and the power hookup worked perfectly for our 46-footer.', 34),
  ('Priya S.', 4, 'Great spot, quiet at night. Only note is the walk to town is a bit longer than expected.', 61)
) AS r(name, rating, body, ord)
WHERE l.is_demo;