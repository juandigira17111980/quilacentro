
-- 1) calificaciones: keep public visibility of safe columns, hide cliente_id
DROP POLICY IF EXISTS calificaciones_publicas ON public.calificaciones;
CREATE POLICY calificaciones_publicas ON public.calificaciones
  FOR SELECT TO anon, authenticated USING (true);

REVOKE SELECT ON public.calificaciones FROM anon, authenticated;
GRANT SELECT (id, rating, comentario, comercio_id, producto_id, created_at)
  ON public.calificaciones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.calificaciones TO authenticated;

-- 2) profiles: restrict row visibility to self or admin
DROP POLICY IF EXISTS profiles_row_visibility ON public.profiles;
CREATE POLICY profiles_self_or_admin_select ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 2b) ensure update policy has WITH CHECK; role change still blocked by trigger
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3) Lock down SECURITY DEFINER functions: remove direct EXECUTE from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_comercio_owner(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_comercio_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validar_publicidad() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validar_promocion() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- get_my_profile is invoked via RPC by signed-in users; keep only authenticated execute
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
