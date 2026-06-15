INSERT INTO public.categorias (nombre, slug, color, orden) VALUES
  ('Alimentos', 'alimentos', '#c4654a', 1),
  ('Bebidas', 'bebidas', '#87a878', 2),
  ('Ropa', 'ropa', '#a0522d', 3),
  ('Hogar', 'hogar', '#4a6741', 4),
  ('Tecnología', 'tecnologia', '#0c2340', 5),
  ('Belleza', 'belleza', '#e8a87c', 6),
  ('Salud', 'salud', '#2d8a9e', 7),
  ('Servicios', 'servicios', '#6b3a2a', 8),
  ('Mascotas', 'mascotas', '#cd7f32', 9),
  ('Deportes', 'deportes', '#5cbdb9', 10),
  ('Juguetería', 'jugueteria', '#e8c07a', 11),
  ('Librería', 'libreria', '#1a4a6e', 12)
ON CONFLICT (slug) DO NOTHING;