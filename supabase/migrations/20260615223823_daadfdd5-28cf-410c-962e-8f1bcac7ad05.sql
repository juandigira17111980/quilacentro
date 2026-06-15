-- PRODUCTOS: consolidar políticas
DROP POLICY IF EXISTS "Dueños actualizan productos de sus comercios" ON public.productos;
DROP POLICY IF EXISTS "Dueños crean productos en sus comercios" ON public.productos;
DROP POLICY IF EXISTS "Dueños eliminan productos de sus comercios" ON public.productos;
DROP POLICY IF EXISTS "Productos disponibles son visibles" ON public.productos;
DROP POLICY IF EXISTS "comercio_own_data" ON public.productos;
DROP POLICY IF EXISTS "productos_publicos" ON public.productos;

CREATE POLICY "comercio_own_data" ON public.productos
  FOR ALL
  TO authenticated
  USING (comercio_id IN (SELECT id FROM public.comercios WHERE owner_id = auth.uid()))
  WITH CHECK (comercio_id IN (SELECT id FROM public.comercios WHERE owner_id = auth.uid()));

CREATE POLICY "productos_publicos" ON public.productos
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL AND disponible = TRUE);

-- CALIFICACIONES: consolidar
DROP POLICY IF EXISTS "Clientes actualizan sus calificaciones" ON public.calificaciones;
DROP POLICY IF EXISTS "Clientes crean sus calificaciones" ON public.calificaciones;
DROP POLICY IF EXISTS "Clientes y admins eliminan calificaciones" ON public.calificaciones;
DROP POLICY IF EXISTS "Calificaciones son visibles para todos" ON public.calificaciones;
DROP POLICY IF EXISTS "own_reviews" ON public.calificaciones;
DROP POLICY IF EXISTS "calificaciones_publicas" ON public.calificaciones;

CREATE POLICY "calificaciones_publicas" ON public.calificaciones
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "own_reviews" ON public.calificaciones
  FOR ALL
  TO authenticated
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());