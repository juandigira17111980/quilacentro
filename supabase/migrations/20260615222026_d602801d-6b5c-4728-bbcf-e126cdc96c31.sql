
-- PRODUCTOS
CREATE TABLE public.productos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id   UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  categoria_id  BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
  nombre        TEXT NOT NULL,
  slug          TEXT NOT NULL,
  descripcion   TEXT,
  precio_base   DECIMAL(12,2) NOT NULL,
  precio_oferta DECIMAL(12,2),
  marca         TEXT,
  sku           TEXT,
  imagen_url    TEXT,
  imagenes      JSONB NOT NULL DEFAULT '[]',
  disponible    BOOLEAN NOT NULL DEFAULT TRUE,
  stock         INT,
  destacado     BOOLEAN NOT NULL DEFAULT FALSE,
  tags          TEXT[],
  atributos     JSONB NOT NULL DEFAULT '{}',
  vistas        INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ,
  UNIQUE (comercio_id, slug)
);
GRANT SELECT ON public.productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_productos_comercio ON public.productos(comercio_id);
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX idx_productos_destacado ON public.productos(destacado) WHERE destacado = true;
CREATE INDEX idx_productos_tags ON public.productos USING GIN(tags);

-- Helper: ¿es dueño de un comercio?
CREATE OR REPLACE FUNCTION public.is_comercio_owner(_user_id UUID, _comercio_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comercios
    WHERE id = _comercio_id AND owner_id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_comercio_owner(UUID, UUID) FROM anon, authenticated, PUBLIC;

CREATE POLICY "Productos disponibles son visibles" ON public.productos
  FOR SELECT USING (
    (disponible = true AND deleted_at IS NULL)
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Dueños crean productos en sus comercios" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños actualizan productos de sus comercios" ON public.productos
  FOR UPDATE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños eliminan productos de sus comercios" ON public.productos
  FOR DELETE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROMOCIONES
CREATE TABLE public.promociones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id   UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  producto_id   UUID REFERENCES public.productos(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  tipo          TEXT NOT NULL
                CHECK (tipo IN ('descuento_pct','descuento_fijo','2x1','envio_gratis','otro')),
  valor         DECIMAL(10,2),
  imagen_url    TEXT,
  fecha_inicio  TIMESTAMPTZ NOT NULL,
  fecha_fin     TIMESTAMPTZ NOT NULL,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  destacada     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.promociones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promociones TO authenticated;
GRANT ALL ON public.promociones TO service_role;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_promociones_comercio ON public.promociones(comercio_id);
CREATE INDEX idx_promociones_producto ON public.promociones(producto_id);
CREATE INDEX idx_promociones_vigencia ON public.promociones(fecha_inicio, fecha_fin) WHERE activa = true;

-- Validar fechas vía trigger (CHECK no permite NOW())
CREATE OR REPLACE FUNCTION public.validar_promocion()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.fecha_fin <= NEW.fecha_inicio THEN
    RAISE EXCEPTION 'La fecha de fin debe ser posterior a la de inicio';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validar_promocion() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER trg_validar_promocion
  BEFORE INSERT OR UPDATE ON public.promociones
  FOR EACH ROW EXECUTE FUNCTION public.validar_promocion();

CREATE TRIGGER update_promociones_updated_at
  BEFORE UPDATE ON public.promociones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Promociones activas vigentes son visibles" ON public.promociones
  FOR SELECT USING (
    (activa = true AND NOW() BETWEEN fecha_inicio AND fecha_fin)
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Dueños crean promociones de sus comercios" ON public.promociones
  FOR INSERT TO authenticated
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños actualizan promociones de sus comercios" ON public.promociones
  FOR UPDATE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños eliminan promociones de sus comercios" ON public.promociones
  FOR DELETE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
