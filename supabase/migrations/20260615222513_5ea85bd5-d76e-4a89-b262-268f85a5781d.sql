
-- CALIFICACIONES
CREATE TABLE public.calificaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comercio_id   UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  producto_id   UUID REFERENCES public.productos(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, comercio_id, producto_id)
);
GRANT SELECT ON public.calificaciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calificaciones TO authenticated;
GRANT ALL ON public.calificaciones TO service_role;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_calificaciones_comercio ON public.calificaciones(comercio_id);
CREATE INDEX idx_calificaciones_producto ON public.calificaciones(producto_id);
CREATE INDEX idx_calificaciones_cliente ON public.calificaciones(cliente_id);

CREATE POLICY "Calificaciones son visibles para todos" ON public.calificaciones
  FOR SELECT USING (true);
CREATE POLICY "Clientes crean sus calificaciones" ON public.calificaciones
  FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Clientes actualizan sus calificaciones" ON public.calificaciones
  FOR UPDATE TO authenticated
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Clientes y admins eliminan calificaciones" ON public.calificaciones
  FOR DELETE TO authenticated
  USING (cliente_id = auth.uid() OR public.is_admin(auth.uid()));

-- FAVORITOS
CREATE TABLE public.favoritos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comercio_id   UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
  producto_id   UUID REFERENCES public.productos(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, comercio_id, producto_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favoritos TO authenticated;
GRANT ALL ON public.favoritos TO service_role;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_favoritos_cliente ON public.favoritos(cliente_id);

CREATE POLICY "Clientes ven sus favoritos" ON public.favoritos
  FOR SELECT TO authenticated
  USING (cliente_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Clientes crean sus favoritos" ON public.favoritos
  FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Clientes eliminan sus favoritos" ON public.favoritos
  FOR DELETE TO authenticated
  USING (cliente_id = auth.uid() OR public.is_admin(auth.uid()));

-- CONSULTAS
CREATE TABLE public.consultas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comercio_id   UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  producto_id   UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  mensaje       TEXT NOT NULL,
  canal         TEXT NOT NULL DEFAULT 'plataforma'
                CHECK (canal IN ('plataforma','whatsapp','email')),
  estado        TEXT NOT NULL DEFAULT 'nuevo'
                CHECK (estado IN ('nuevo','leido','respondido')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultas TO authenticated;
GRANT INSERT ON public.consultas TO anon;
GRANT ALL ON public.consultas TO service_role;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_consultas_comercio ON public.consultas(comercio_id);
CREATE INDEX idx_consultas_cliente ON public.consultas(cliente_id);

CREATE POLICY "Cliente y dueño ven la consulta" ON public.consultas
  FOR SELECT TO authenticated
  USING (
    cliente_id = auth.uid()
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Cualquiera puede crear una consulta" ON public.consultas
  FOR INSERT WITH CHECK (
    cliente_id IS NULL OR cliente_id = auth.uid()
  );
CREATE POLICY "Dueño actualiza estado de consultas" ON public.consultas
  FOR UPDATE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Cliente, dueño y admin eliminan consultas" ON public.consultas
  FOR DELETE TO authenticated
  USING (
    cliente_id = auth.uid()
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );

-- HISTORIAL DE BUSQUEDAS
CREATE TABLE public.historial_busquedas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  termino       TEXT NOT NULL,
  resultados    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, DELETE ON public.historial_busquedas TO authenticated;
GRANT INSERT ON public.historial_busquedas TO anon;
GRANT ALL ON public.historial_busquedas TO service_role;
ALTER TABLE public.historial_busquedas ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_historial_cliente ON public.historial_busquedas(cliente_id);
CREATE INDEX idx_historial_termino ON public.historial_busquedas(termino);

CREATE POLICY "Cliente ve su historial" ON public.historial_busquedas
  FOR SELECT TO authenticated
  USING (cliente_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Cualquiera registra búsquedas" ON public.historial_busquedas
  FOR INSERT WITH CHECK (
    cliente_id IS NULL OR cliente_id = auth.uid()
  );
CREATE POLICY "Cliente y admin eliminan historial" ON public.historial_busquedas
  FOR DELETE TO authenticated
  USING (cliente_id = auth.uid() OR public.is_admin(auth.uid()));
