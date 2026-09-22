-- Keep administrative profile edits and their audit record in one transaction.
CREATE OR REPLACE FUNCTION public.admin_update_profile_details(
  p_actor_id UUID,
  p_target_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_reason TEXT,
  p_request_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor public.profiles;
  v_before public.profiles;
  v_after public.profiles;
  v_name TEXT := trim(coalesce(p_full_name, ''));
  v_phone TEXT := nullif(trim(coalesce(p_phone, '')), '');
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Nombre invalido';
  END IF;
  IF v_phone IS NOT NULL AND (length(v_phone) < 7 OR length(v_phone) > 30) THEN
    RAISE EXCEPTION 'Telefono invalido';
  END IF;
  IF length(trim(coalesce(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION 'Motivo demasiado corto';
  END IF;

  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.role <> 'super_admin' OR v_actor.account_status <> 'activo' THEN
    RAISE EXCEPTION 'Solo un super administrador activo puede editar perfiles';
  END IF;
  SELECT * INTO v_before FROM public.profiles WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;

  UPDATE public.profiles
  SET full_name = v_name, phone = v_phone
  WHERE id = p_target_id RETURNING * INTO v_after;

  INSERT INTO public.audit_events (
    actor_id, action, resource_type, resource_id, reason, before_data, after_data,
    request_id, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'identity.profile_updated', 'profile', p_target_id::text, trim(p_reason),
    jsonb_build_object('name_changed', v_before.full_name IS DISTINCT FROM v_after.full_name,
                       'phone_changed', v_before.phone IS DISTINCT FROM v_after.phone),
    jsonb_build_object('fields', ARRAY['full_name', 'phone']),
    p_request_id, p_ip_address, p_user_agent
  );

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_profile_details(UUID, UUID, TEXT, TEXT, TEXT, UUID, INET, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_details(UUID, UUID, TEXT, TEXT, TEXT, UUID, INET, TEXT)
  TO service_role;
