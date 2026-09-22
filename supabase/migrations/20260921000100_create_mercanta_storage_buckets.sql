-- Creates the private buckets expected by the existing storage RLS policies.
-- Objects are served with signed URLs; no bucket is publicly exposed.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'comercios',
    'comercios',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'productos',
    'productos',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'promociones',
    'promociones',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
