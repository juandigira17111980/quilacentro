
-- Reemplaza índices previos por versiones con filtro parcial
DROP INDEX IF EXISTS public.idx_productos_comercio;
DROP INDEX IF EXISTS public.idx_productos_categoria;
DROP INDEX IF EXISTS public.idx_promociones_vigencia;
DROP INDEX IF EXISTS public.idx_comercios_zona;
DROP INDEX IF EXISTS public.idx_comercios_categoria;

-- Búsqueda full-text en productos (español)
CREATE INDEX IF NOT EXISTS idx_productos_search ON public.productos
  USING GIN (to_tsvector('spanish',
    nombre || ' ' || COALESCE(descripcion,'') || ' ' || COALESCE(marca,'')
  ));

-- Geolocalización
CREATE INDEX IF NOT EXISTS idx_comercios_geo ON public.comercios(lat, lng)
  WHERE deleted_at IS NULL AND estado = 'activo';

-- Filtros frecuentes
CREATE INDEX idx_productos_comercio ON public.productos(comercio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_promociones_vigentes ON public.promociones(fecha_inicio, fecha_fin) WHERE activa = TRUE;
CREATE INDEX idx_comercios_zona ON public.comercios(zona_id) WHERE estado = 'activo';
CREATE INDEX idx_comercios_categoria ON public.comercios(categoria_id) WHERE estado = 'activo';
