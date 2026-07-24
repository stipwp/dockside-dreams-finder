
-- 1. Extend listings with short-term rental fields + listing_type
DO $$ BEGIN
  CREATE TYPE public.listing_type AS ENUM ('home_sale', 'slip_lease', 'slip_short_term');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending','accepted','declined','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_type public.listing_type,
  ADD COLUMN IF NOT EXISTS nightly_price_cents integer,
  ADD COLUMN IF NOT EXISTS weekly_price_cents integer,
  ADD COLUMN IF NOT EXISTS cleaning_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_nights integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_nights integer,
  ADD COLUMN IF NOT EXISTS advance_notice_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS instant_book boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_boat_beam_ft numeric,
  ADD COLUMN IF NOT EXISTS max_boat_draft_ft numeric,
  ADD COLUMN IF NOT EXISTS max_guests integer NOT NULL DEFAULT 4;

-- Backfill listing_type from existing 'kind' + 'price_period'
UPDATE public.listings
SET listing_type = CASE
  WHEN kind = 'home' THEN 'home_sale'::public.listing_type
  WHEN kind = 'slip' THEN 'slip_lease'::public.listing_type
  ELSE 'home_sale'::public.listing_type
END
WHERE listing_type IS NULL;

-- 2. listing_availability
CREATE TABLE IF NOT EXISTS public.listing_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_blocked boolean NOT NULL DEFAULT true,
  price_cents_override integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, date)
);

GRANT SELECT ON public.listing_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_availability TO authenticated;
GRANT ALL ON public.listing_availability TO service_role;
ALTER TABLE public.listing_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability readable for published listings"
  ON public.listing_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_availability.listing_id AND l.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_availability.listing_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners manage their listing availability"
  ON public.listing_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_availability.listing_id AND l.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_availability.listing_id AND l.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS listing_availability_listing_date_idx
  ON public.listing_availability(listing_id, date);

-- 3. bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  boat_name text,
  boat_length_ft numeric,
  boat_beam_ft numeric,
  boat_draft_ft numeric,
  message text,
  nights integer NOT NULL,
  subtotal_cents integer NOT NULL DEFAULT 0,
  cleaning_fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'pending',
  host_note text,
  payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests and hosts read their bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Guests create bookings as themselves"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Guests and hosts update their bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = guest_id OR auth.uid() = host_id)
  WITH CHECK (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE INDEX IF NOT EXISTS bookings_listing_dates_idx ON public.bookings(listing_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS bookings_guest_idx ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS bookings_host_idx ON public.bookings(host_id);

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER listing_availability_set_updated_at
  BEFORE UPDATE ON public.listing_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. booking_messages
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.booking_messages TO authenticated;
GRANT ALL ON public.booking_messages TO service_role;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read booking messages"
  ON public.booking_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_messages.booking_id
      AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
  ));

CREATE POLICY "Participants send messages as themselves"
  ON public.booking_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_messages.booking_id
        AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS booking_messages_booking_idx ON public.booking_messages(booking_id, created_at);
