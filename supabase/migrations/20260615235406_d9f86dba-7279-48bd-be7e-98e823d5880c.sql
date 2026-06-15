
SET session_replication_role = replica;
UPDATE public.profiles SET role='admin', full_name='Administrador'
WHERE id='00605891-96da-4a2c-bb45-d78f6bdfd06d';
SET session_replication_role = DEFAULT;

INSERT INTO public.comercios (
  owner_id, nombre, slug, descripcion, telefono, whatsapp, direccion, estado
) VALUES (
  '3baac9cb-fdc4-48ba-981e-d6bb4b262834',
  'Comercio Demo','comercio-demo','Comercio de demostración para pruebas',
  '+543794000000','+543794000000','Quillá Centro, Corrientes','activo'
) ON CONFLICT (slug) DO NOTHING;
