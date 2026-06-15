
-- Storage RLS policies for comercios, productos, promociones buckets.
-- Authenticated users can manage files under a path prefixed by their auth.uid().
-- Public SELECT allowed so signed URLs are not strictly required for reads.

CREATE POLICY "Public read comercios"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'comercios');

CREATE POLICY "Owner upload comercios"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comercios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner update comercios"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'comercios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner delete comercios"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'comercios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read productos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'productos');

CREATE POLICY "Owner upload productos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner update productos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'productos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner delete productos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'productos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read promociones"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'promociones');

CREATE POLICY "Owner upload promociones"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'promociones' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner update promociones"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'promociones' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner delete promociones"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'promociones' AND (storage.foldername(name))[1] = auth.uid()::text);
