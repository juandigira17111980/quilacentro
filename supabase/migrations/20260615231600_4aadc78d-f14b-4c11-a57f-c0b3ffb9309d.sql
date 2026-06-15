
-- Prevent duplicate reviews from same customer to same store
ALTER TABLE public.calificaciones
  DROP CONSTRAINT IF EXISTS calificaciones_cliente_comercio_unique;
ALTER TABLE public.calificaciones
  ADD CONSTRAINT calificaciones_cliente_comercio_unique UNIQUE (cliente_id, comercio_id);

-- Function to recompute comercio rating aggregates
CREATE OR REPLACE FUNCTION public.recompute_comercio_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comercio uuid;
BEGIN
  v_comercio := COALESCE(NEW.comercio_id, OLD.comercio_id);
  UPDATE public.comercios c
  SET
    rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.calificaciones WHERE comercio_id = v_comercio), 0),
    total_reviews = COALESCE((SELECT COUNT(*) FROM public.calificaciones WHERE comercio_id = v_comercio), 0),
    updated_at = now()
  WHERE c.id = v_comercio;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_calificaciones_aggregate ON public.calificaciones;
CREATE TRIGGER trg_calificaciones_aggregate
AFTER INSERT OR UPDATE OR DELETE ON public.calificaciones
FOR EACH ROW EXECUTE FUNCTION public.recompute_comercio_rating();
