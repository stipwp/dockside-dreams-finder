
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public read listing photos" ON storage.objects;
CREATE POLICY "Public read published listing photos" ON storage.objects FOR SELECT
USING (
  bucket_id = 'listing-photos' AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id::text = (storage.foldername(name))[2] AND l.status = 'published'
  )
);
CREATE POLICY "Owners read own listing photos" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text
);
