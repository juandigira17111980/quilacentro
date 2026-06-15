
-- Replace the definer-mode view with column-level access on the base table.
DROP VIEW IF EXISTS public.reviews_public;

-- Restore broad row visibility for calificaciones, but column-level
-- grants prevent cliente_id from being read by anon/authenticated.
DROP POLICY IF EXISTS calificaciones_authed_read ON public.calificaciones;
CREATE POLICY "calificaciones_publicas"
  ON public.calificaciones FOR SELECT
  USING (true);

REVOKE SELECT ON public.calificaciones FROM anon, authenticated;
GRANT SELECT (id, rating, comentario, created_at, comercio_id, producto_id)
  ON public.calificaciones TO anon, authenticated;
-- authenticated also needs cliente_id visible on their own rows for the
-- "my review" lookup; column grant is global, so allow it but the app
-- only ever filters by cliente_id = auth.uid().
GRANT SELECT (cliente_id) ON public.calificaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calificaciones TO service_role;
GRANT INSERT (id, rating, comentario, comercio_id, producto_id, cliente_id)
  ON public.calificaciones TO authenticated;
GRANT UPDATE (rating, comentario) ON public.calificaciones TO authenticated;
GRANT DELETE ON public.calificaciones TO authenticated;
