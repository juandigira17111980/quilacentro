-- 1) calificaciones: revoke full SELECT from anon, grant only safe columns
REVOKE SELECT ON public.calificaciones FROM anon;
GRANT SELECT (id, comercio_id, producto_id, rating, comentario, created_at) ON public.calificaciones TO anon;

-- 2) comercios: hide email from anon
REVOKE SELECT ON public.comercios FROM anon;
GRANT SELECT (
  id, owner_id, zona_id, nombre, slug, descripcion, logo_url, banner_url,
  categoria_id, direccion, lat, lng, telefono, whatsapp, horarios,
  estado, plan_id, rating_avg, total_reviews, created_at, updated_at,
  created_by, deleted_at, tour_360_url,
  recogida_disponible, recogida_notas,
  domicilio_disponible, domicilio_notas,
  disponibilidad_notas, confianza_notas
) ON public.comercios TO anon;

-- 3) Restrict EXECUTE on SECURITY DEFINER functions to authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_comercio_owner(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_comercio_owner(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;