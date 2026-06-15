
-- Ampliar planes_suscripcion
ALTER TABLE public.planes_suscripcion
  ADD COLUMN IF NOT EXISTS max_productos   INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS destacados_mes  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS permite_ia      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS permite_stats   BOOLEAN NOT NULL DEFAULT TRUE;

-- Renombrar precio_mensual -> precio_mes para alinear con la especificación
ALTER TABLE public.planes_suscripcion RENAME COLUMN precio_mensual TO precio_mes;

-- PUBLICIDAD
CREATE TABLE public.publicidad (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id   UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL
                CHECK (tipo IN ('banner_home','producto_destacado','categoria_top')),
  zona_id       BIGINT REFERENCES public.zonas(id) ON DELETE SET NULL,
  imagen_url    TEXT,
  url_destino   TEXT,
  fecha_inicio  TIMESTAMPTZ NOT NULL,
  fecha_fin     TIMESTAMPTZ NOT NULL,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.publicidad TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicidad TO authenticated;
GRANT ALL ON public.publicidad TO service_role;
ALTER TABLE public.publicidad ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_publicidad_comercio ON public.publicidad(comercio_id);
CREATE INDEX idx_publicidad_zona ON public.publicidad(zona_id);
CREATE INDEX idx_publicidad_vigencia ON public.publicidad(fecha_inicio, fecha_fin) WHERE activa = true;

CREATE OR REPLACE FUNCTION public.validar_publicidad()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.fecha_fin <= NEW.fecha_inicio THEN
    RAISE EXCEPTION 'La fecha de fin debe ser posterior a la de inicio';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validar_publicidad() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER trg_validar_publicidad
  BEFORE INSERT OR UPDATE ON public.publicidad
  FOR EACH ROW EXECUTE FUNCTION public.validar_publicidad();

CREATE POLICY "Publicidad vigente visible para todos" ON public.publicidad
  FOR SELECT USING (
    (activa = true AND NOW() BETWEEN fecha_inicio AND fecha_fin)
    OR public.is_comercio_owner(auth.uid(), comercio_id)
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Dueños crean publicidad de sus comercios" ON public.publicidad
  FOR INSERT TO authenticated
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños actualizan publicidad de sus comercios" ON public.publicidad
  FOR UPDATE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños eliminan publicidad de sus comercios" ON public.publicidad
  FOR DELETE TO authenticated
  USING (public.is_comercio_owner(auth.uid(), comercio_id) OR public.is_admin(auth.uid()));
