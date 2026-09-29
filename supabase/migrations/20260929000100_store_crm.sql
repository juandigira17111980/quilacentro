-- A lead belongs to exactly one store. Anonymous CTA events remain analytics,
-- not identifiable CRM records.
ALTER TABLE public.consultas DROP CONSTRAINT IF EXISTS consultas_canal_check;
ALTER TABLE public.consultas ADD CONSTRAINT consultas_canal_check
  CHECK (canal IN ('plataforma', 'whatsapp', 'email', 'telefono'));

CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  consulta_id UUID UNIQUE REFERENCES public.consultas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  origen TEXT NOT NULL CHECK (origen IN ('plataforma', 'manual', 'whatsapp', 'telefono')),
  contacto_nombre TEXT NOT NULL CHECK (char_length(trim(contacto_nombre)) BETWEEN 2 AND 120),
  contacto_telefono TEXT,
  asunto TEXT NOT NULL CHECK (char_length(trim(asunto)) BETWEEN 3 AND 200),
  estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'cotizado', 'ganado', 'perdido')),
  responsable_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  proxima_accion_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX crm_leads_store_state_created ON public.crm_leads(comercio_id, estado, created_at DESC);
CREATE INDEX crm_leads_store_followup ON public.crm_leads(comercio_id, proxima_accion_at)
  WHERE proxima_accion_at IS NOT NULL;

CREATE TABLE public.crm_actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('nota', 'estado', 'asignacion', 'seguimiento')),
  detalle TEXT NOT NULL CHECK (char_length(trim(detalle)) BETWEEN 2 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_actividades_lead_created ON public.crm_actividades(lead_id, created_at DESC);

CREATE FUNCTION public.crm_registrar_cambios()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.crm_actividades (lead_id, actor_id, tipo, detalle)
    VALUES (NEW.id, NEW.updated_by, 'estado', 'Estado: ' || NEW.estado);
  END IF;
  IF NEW.responsable_id IS DISTINCT FROM OLD.responsable_id THEN
    INSERT INTO public.crm_actividades (lead_id, actor_id, tipo, detalle)
    VALUES (NEW.id, NEW.updated_by, 'asignacion', 'Responsable actualizado');
  END IF;
  IF NEW.proxima_accion_at IS DISTINCT FROM OLD.proxima_accion_at THEN
    INSERT INTO public.crm_actividades (lead_id, actor_id, tipo, detalle)
    VALUES (NEW.id, NEW.updated_by, 'seguimiento', 'Próxima acción actualizada');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_registrar_cambios() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER crm_lead_actualizado AFTER UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_registrar_cambios();

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipo autorizado ve leads de su tienda" ON public.crm_leads
  FOR SELECT TO authenticated USING (
    public.is_comercio_member(auth.uid(), comercio_id, ARRAY['owner', 'manager', 'atencion']::TEXT[])
  );
CREATE POLICY "Equipo autorizado ve actividad de su tienda" ON public.crm_actividades
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id)
  );

REVOKE ALL ON public.crm_leads, public.crm_actividades FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.crm_leads, public.crm_actividades TO authenticated;
GRANT ALL ON public.crm_leads, public.crm_actividades TO service_role;

CREATE OR REPLACE FUNCTION public.crm_crear_lead_desde_consulta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.crm_leads (
    comercio_id, consulta_id, cliente_id, producto_id, origen, contacto_nombre, asunto
  ) SELECT
    NEW.comercio_id, NEW.id, NEW.cliente_id, NEW.producto_id, 'plataforma',
    CASE WHEN char_length(trim(coalesce(p.full_name, ''))) >= 2 THEN trim(p.full_name)
      ELSE 'Cliente de la plataforma' END,
    CASE WHEN char_length(trim(NEW.mensaje)) >= 3 THEN left(NEW.mensaje, 200)
      ELSE 'Consulta' END
  FROM public.profiles p WHERE p.id = NEW.cliente_id;

  IF NOT FOUND THEN
    INSERT INTO public.crm_leads (
      comercio_id, consulta_id, cliente_id, producto_id, origen, contacto_nombre, asunto
    ) VALUES (
      NEW.comercio_id, NEW.id, NEW.cliente_id, NEW.producto_id, 'plataforma',
      'Cliente de la plataforma', CASE WHEN char_length(trim(NEW.mensaje)) >= 3
        THEN left(NEW.mensaje, 200) ELSE 'Consulta' END
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_crear_lead_desde_consulta() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER crm_consulta_creada AFTER INSERT ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.crm_crear_lead_desde_consulta();

INSERT INTO public.crm_leads (
  comercio_id, consulta_id, cliente_id, producto_id, origen, contacto_nombre, asunto
)
SELECT q.comercio_id, q.id, q.cliente_id, q.producto_id, 'plataforma',
  CASE WHEN char_length(trim(coalesce(p.full_name, ''))) >= 2 THEN trim(p.full_name)
    ELSE 'Cliente de la plataforma' END,
  CASE WHEN char_length(trim(q.mensaje)) >= 3 THEN left(q.mensaje, 200)
    ELSE 'Consulta' END
FROM public.consultas q LEFT JOIN public.profiles p ON p.id = q.cliente_id
ON CONFLICT (consulta_id) DO NOTHING;

CREATE FUNCTION public.crm_resumen_admin()
RETURNS TABLE (
  comercio_id UUID, total BIGINT, nuevo BIGINT, contactado BIGINT,
  cotizado BIGINT, ganado BIGINT, perdido BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.comercio_id, count(*),
    count(*) FILTER (WHERE l.estado = 'nuevo'),
    count(*) FILTER (WHERE l.estado = 'contactado'),
    count(*) FILTER (WHERE l.estado = 'cotizado'),
    count(*) FILTER (WHERE l.estado = 'ganado'),
    count(*) FILTER (WHERE l.estado = 'perdido')
  FROM public.crm_leads l GROUP BY l.comercio_id;
$$;
REVOKE ALL ON FUNCTION public.crm_resumen_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_resumen_admin() TO service_role;

NOTIFY pgrst, 'reload schema';
