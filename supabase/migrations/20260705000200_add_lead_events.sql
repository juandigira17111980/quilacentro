-- Commercial intent events for measurable WhatsApp, directions and availability flows.
-- Additive migration: does not alter existing consultas behavior.

CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  source TEXT NOT NULL DEFAULT 'unknown',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lead_events_event_type_check CHECK (
    event_type IN ('whatsapp_click', 'directions_click', 'availability_submit')
  ),
  CONSTRAINT lead_events_channel_check CHECK (
    channel IN ('web', 'whatsapp', 'maps', 'platform')
  ),
  CONSTRAINT lead_events_source_check CHECK (
    source IN ('product_detail', 'store_detail', 'map', 'search', 'unknown')
  )
);

CREATE INDEX IF NOT EXISTS idx_lead_events_comercio_created_at
  ON public.lead_events (comercio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_events_producto_created_at
  ON public.lead_events (producto_id, created_at DESC)
  WHERE producto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_events_type_created_at
  ON public.lead_events (event_type, created_at DESC);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.lead_events TO anon, authenticated;
GRANT SELECT ON public.lead_events TO authenticated;
GRANT ALL ON public.lead_events TO service_role;

DROP POLICY IF EXISTS "Public can create lead events" ON public.lead_events;
CREATE POLICY "Public can create lead events"
  ON public.lead_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can read lead events" ON public.lead_events;
CREATE POLICY "Owners can read lead events"
  ON public.lead_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.comercios c
      WHERE c.id = lead_events.comercio_id
        AND (
          c.owner_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );
