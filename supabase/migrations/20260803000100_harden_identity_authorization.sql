-- Fase 1: identidad, autorizacion y trazabilidad administrativa.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'activo'
    CHECK (account_status IN ('activo', 'suspendido')),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles (account_status);

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'super_admin' AND account_status = 'activo'
  )
$$;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_current_identity()
RETURNS TABLE (role TEXT, account_status TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.role, p.account_status
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.get_current_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_identity() TO authenticated;

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  reason TEXT,
  before_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_created
  ON public.audit_events (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created
  ON public.audit_events (actor_id, created_at DESC);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_events FROM anon, authenticated;
GRANT ALL ON public.audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := coalesce(NEW.raw_user_meta_data->>'role', 'cliente');
  IF v_role NOT IN ('cliente', 'comercio') THEN v_role := 'cliente'; END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.audit_events (action, resource_type, resource_id, after_data)
  VALUES (
    'identity.account_created',
    'profile',
    NEW.id::text,
    jsonb_build_object('role', v_role, 'account_status', 'activo')
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.account_status IS DISTINCT FROM OLD.account_status)
    AND auth.role() <> 'service_role'
    AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado para modificar identidad o estado de cuenta';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_profile_role(
  p_actor_id UUID, p_target_id UUID, p_new_role TEXT, p_reason TEXT DEFAULT NULL,
  p_request_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor public.profiles;
  v_target public.profiles;
  v_updated public.profiles;
  v_super_admin_count INTEGER;
BEGIN
  IF p_actor_id = p_target_id THEN RAISE EXCEPTION 'No se permite modificar el propio rol'; END IF;
  IF p_new_role NOT IN ('cliente', 'comercio', 'admin', 'super_admin') THEN RAISE EXCEPTION 'Rol invalido'; END IF;
  IF length(trim(coalesce(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'El motivo debe tener al menos 10 caracteres'; END IF;

  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.role <> 'super_admin' OR v_actor.account_status <> 'activo' THEN
    RAISE EXCEPTION 'Solo un super administrador activo puede cambiar roles';
  END IF;
  SELECT * INTO v_target FROM public.profiles WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;

  IF v_target.role = 'super_admin' AND p_new_role <> 'super_admin' THEN
    SELECT count(*) INTO v_super_admin_count FROM public.profiles
      WHERE role = 'super_admin' AND account_status = 'activo';
    IF v_super_admin_count <= 1 THEN RAISE EXCEPTION 'No se puede degradar al ultimo super administrador activo'; END IF;
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_target_id RETURNING * INTO v_updated;
  INSERT INTO public.audit_events (
    actor_id, action, resource_type, resource_id, reason, before_data, after_data,
    request_id, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'identity.role_changed', 'profile', p_target_id::text, trim(p_reason),
    jsonb_build_object('role', v_target.role, 'account_status', v_target.account_status),
    jsonb_build_object('role', v_updated.role, 'account_status', v_updated.account_status),
    p_request_id, p_ip_address, p_user_agent
  );
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  p_actor_id UUID, p_target_id UUID, p_account_status TEXT, p_reason TEXT,
  p_request_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor public.profiles;
  v_target public.profiles;
  v_updated public.profiles;
  v_super_admin_count INTEGER;
BEGIN
  IF p_actor_id = p_target_id THEN RAISE EXCEPTION 'No se permite modificar el propio estado de cuenta'; END IF;
  IF p_account_status NOT IN ('activo', 'suspendido') THEN RAISE EXCEPTION 'Estado de cuenta invalido'; END IF;
  IF length(trim(coalesce(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'El motivo debe tener al menos 10 caracteres'; END IF;

  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.role <> 'super_admin' OR v_actor.account_status <> 'activo' THEN
    RAISE EXCEPTION 'Solo un super administrador activo puede modificar cuentas';
  END IF;
  SELECT * INTO v_target FROM public.profiles WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;

  IF v_target.role = 'super_admin' AND p_account_status = 'suspendido' THEN
    SELECT count(*) INTO v_super_admin_count FROM public.profiles
      WHERE role = 'super_admin' AND account_status = 'activo';
    IF v_super_admin_count <= 1 THEN RAISE EXCEPTION 'No se puede suspender al ultimo super administrador activo'; END IF;
  END IF;

  UPDATE public.profiles
  SET account_status = p_account_status,
      suspended_at = CASE WHEN p_account_status = 'suspendido' THEN now() ELSE NULL END,
      suspended_by = CASE WHEN p_account_status = 'suspendido' THEN p_actor_id ELSE NULL END,
      suspension_reason = CASE WHEN p_account_status = 'suspendido' THEN trim(p_reason) ELSE NULL END
  WHERE id = p_target_id RETURNING * INTO v_updated;

  INSERT INTO public.audit_events (
    actor_id, action, resource_type, resource_id, reason, before_data, after_data,
    request_id, ip_address, user_agent
  ) VALUES (
    p_actor_id,
    CASE WHEN p_account_status = 'suspendido' THEN 'identity.account_suspended' ELSE 'identity.account_reactivated' END,
    'profile', p_target_id::text, trim(p_reason),
    jsonb_build_object('account_status', v_target.account_status),
    jsonb_build_object('account_status', v_updated.account_status),
    p_request_id, p_ip_address, p_user_agent
  );
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_store_status(
  p_actor_id UUID, p_store_id UUID, p_estado TEXT, p_reason TEXT DEFAULT NULL,
  p_request_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS public.comercios
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor public.profiles;
  v_store public.comercios;
  v_updated public.comercios;
BEGIN
  IF p_estado NOT IN ('pendiente', 'activo', 'suspendido', 'inactivo') THEN RAISE EXCEPTION 'Estado de comercio invalido'; END IF;
  IF p_estado IN ('suspendido', 'inactivo') AND length(trim(coalesce(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION 'El motivo debe tener al menos 10 caracteres';
  END IF;
  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.account_status <> 'activo' OR v_actor.role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Solo administradores activos pueden cambiar comercios';
  END IF;
  SELECT * INTO v_store FROM public.comercios WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comercio no encontrado'; END IF;

  UPDATE public.comercios SET estado = p_estado WHERE id = p_store_id RETURNING * INTO v_updated;
  INSERT INTO public.audit_events (
    actor_id, action, resource_type, resource_id, reason, before_data, after_data,
    request_id, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'commerce.status_changed', 'comercio', p_store_id::text, p_reason,
    jsonb_build_object('estado', v_store.estado), jsonb_build_object('estado', v_updated.estado),
    p_request_id, p_ip_address, p_user_agent
  );
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_admin_audit_event(
  p_actor_id UUID, p_action TEXT, p_resource_type TEXT, p_resource_id TEXT,
  p_reason TEXT DEFAULT NULL, p_before_data JSONB DEFAULT '{}'::jsonb,
  p_after_data JSONB DEFAULT '{}'::jsonb, p_request_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor public.profiles;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.account_status <> 'activo' OR v_actor.role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Solo administradores activos pueden registrar acciones administrativas';
  END IF;
  INSERT INTO public.audit_events (
    actor_id, action, resource_type, resource_id, reason, before_data, after_data,
    request_id, ip_address, user_agent
  ) VALUES (
    p_actor_id, p_action, p_resource_type, p_resource_id, p_reason,
    coalesce(p_before_data, '{}'::jsonb), coalesce(p_after_data, '{}'::jsonb),
    p_request_id, p_ip_address, p_user_agent
  ) RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_profile_role(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_account_status(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_change_store_status(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_admin_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, UUID, INET, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_profile_role(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_store_status(UUID, UUID, TEXT, TEXT, UUID, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_admin_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, UUID, INET, TEXT) TO service_role;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

-- Los estados administrativos solo pueden cambiar por las funciones auditadas.
REVOKE UPDATE ON public.comercios FROM authenticated;
GRANT UPDATE (
  zona_id, nombre, slug, descripcion, logo_url, banner_url, categoria_id,
  direccion, lat, lng, telefono, whatsapp, email, horarios, tour_360_url,
  recogida_disponible, recogida_notas, domicilio_disponible, domicilio_notas,
  disponibilidad_notas, confianza_notas
) ON public.comercios TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.categorias FROM authenticated;
