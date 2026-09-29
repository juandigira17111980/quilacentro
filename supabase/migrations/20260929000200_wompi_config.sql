-- No payment processing is enabled by this table. Secrets are encrypted in
-- the application server before insertion and never returned by an API.
CREATE TABLE public.wompi_config (
  ambiente TEXT PRIMARY KEY CHECK (ambiente IN ('test', 'prod')),
  credentials_encrypted TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wompi_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wompi_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.wompi_config TO service_role;

NOTIFY pgrst, 'reload schema';
