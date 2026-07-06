-- Store operational settings shown in public conversion surfaces.
-- Safe additive migration: defaults keep existing stores working.

ALTER TABLE public.comercios
  ADD COLUMN IF NOT EXISTS recogida_disponible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS recogida_notas TEXT,
  ADD COLUMN IF NOT EXISTS domicilio_disponible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS domicilio_notas TEXT,
  ADD COLUMN IF NOT EXISTS disponibilidad_notas TEXT,
  ADD COLUMN IF NOT EXISTS confianza_notas TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comercios_recogida_notas_len'
  ) THEN
    ALTER TABLE public.comercios
      ADD CONSTRAINT comercios_recogida_notas_len
      CHECK (recogida_notas IS NULL OR char_length(recogida_notas) <= 240);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comercios_domicilio_notas_len'
  ) THEN
    ALTER TABLE public.comercios
      ADD CONSTRAINT comercios_domicilio_notas_len
      CHECK (domicilio_notas IS NULL OR char_length(domicilio_notas) <= 240);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comercios_disponibilidad_notas_len'
  ) THEN
    ALTER TABLE public.comercios
      ADD CONSTRAINT comercios_disponibilidad_notas_len
      CHECK (disponibilidad_notas IS NULL OR char_length(disponibilidad_notas) <= 240);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comercios_confianza_notas_len'
  ) THEN
    ALTER TABLE public.comercios
      ADD CONSTRAINT comercios_confianza_notas_len
      CHECK (confianza_notas IS NULL OR char_length(confianza_notas) <= 240);
  END IF;
END $$;
