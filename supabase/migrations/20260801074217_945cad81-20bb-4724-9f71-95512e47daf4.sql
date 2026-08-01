REVOKE ALL ON FUNCTION public.refresh_listing_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_tier(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_tier(uuid) TO service_role;