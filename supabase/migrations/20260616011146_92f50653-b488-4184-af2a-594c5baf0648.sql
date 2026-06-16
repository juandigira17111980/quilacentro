
-- These functions are used inside RLS policies; policy expressions run as the caller's role
-- so anon/authenticated must be able to EXECUTE them. They are SECURITY DEFINER and only
-- return a boolean, so this is safe.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_comercio_owner(uuid, uuid) TO anon, authenticated;
