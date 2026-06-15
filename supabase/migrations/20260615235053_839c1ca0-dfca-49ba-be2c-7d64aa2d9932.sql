
-- 1) PROFILES: column-level restriction + RPC for self/admin full profile
DROP POLICY IF EXISTS "Profiles son visibles para todos" ON public.profiles;

CREATE POLICY "profiles_row_visibility"
  ON public.profiles FOR SELECT
  USING (true);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url) ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT INSERT (id, full_name, phone, avatar_url, role) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id uuid, full_name text, phone text, avatar_url text,
  role text, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.phone, p.avatar_url, p.role, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 2) Prevent role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'No tenés permiso para modificar el rol';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 3) CALIFICACIONES: hide cliente_id from public; safe denormalized view
DROP POLICY IF EXISTS calificaciones_publicas ON public.calificaciones;

CREATE POLICY "calificaciones_authed_read" ON public.calificaciones
  FOR SELECT TO authenticated
  USING (
    cliente_id = auth.uid()
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );

REVOKE SELECT ON public.calificaciones FROM anon;

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = off) AS
SELECT c.id, c.rating, c.comentario, c.created_at,
       c.comercio_id, c.producto_id,
       p.full_name AS cliente_nombre,
       p.avatar_url AS cliente_avatar
FROM public.calificaciones c
LEFT JOIN public.profiles p ON p.id = c.cliente_id;

GRANT SELECT ON public.reviews_public TO anon, authenticated;
