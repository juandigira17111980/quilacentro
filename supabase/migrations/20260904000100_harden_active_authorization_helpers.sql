-- Suspended accounts must lose authorization even when a caller bypasses the UI
-- and talks to Supabase directly. These helpers are used by legacy and current RLS.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('admin', 'super_admin')
      AND account_status = 'activo'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_comercio_owner(_user_id UUID, _comercio_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.comercios c
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE c.id = _comercio_id
      AND c.owner_id = _user_id
      AND c.deleted_at IS NULL
      AND p.role = 'comercio'
      AND p.account_status = 'activo'
  )
$$;

-- Public read policies call these boolean-only SECURITY DEFINER helpers.
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_comercio_owner(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_comercio_owner(UUID, UUID) TO anon, authenticated, service_role;
