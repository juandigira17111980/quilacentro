
-- PROFILES
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'cliente'
                CHECK (role IN ('cliente','comercio','admin','super_admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper para chequear rol sin recursión
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role IN ('admin','super_admin')
  )
$$;

CREATE POLICY "Profiles son visibles para todos" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden crear su propio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins pueden gestionar perfiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ZONAS
CREATE TABLE public.zonas (
  id            BIGSERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  ciudad        TEXT NOT NULL,
  departamento  TEXT NOT NULL,
  pais          TEXT NOT NULL DEFAULT 'Colombia',
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.zonas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zonas TO authenticated;
GRANT ALL ON public.zonas TO service_role;
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zonas activas son visibles para todos" ON public.zonas
  FOR SELECT USING (activa = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins gestionan zonas" ON public.zonas
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- CATEGORIAS
CREATE TABLE public.categorias (
  id            BIGSERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  icono_url     TEXT,
  color         TEXT,
  padre_id      BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  orden         INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias activas son visibles para todos" ON public.categorias
  FOR SELECT USING (activa = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins gestionan categorias" ON public.categorias
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- PLANES DE SUSCRIPCION (mínimo, requerido por comercios)
CREATE TABLE public.planes_suscripcion (
  id              BIGSERIAL PRIMARY KEY,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  precio_mensual  DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.planes_suscripcion TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planes_suscripcion TO authenticated;
GRANT ALL ON public.planes_suscripcion TO service_role;
ALTER TABLE public.planes_suscripcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planes activos son visibles para todos" ON public.planes_suscripcion
  FOR SELECT USING (activo = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins gestionan planes" ON public.planes_suscripcion
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- COMERCIOS
CREATE TABLE public.comercios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zona_id        BIGINT REFERENCES public.zonas(id) ON DELETE SET NULL,
  nombre         TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  descripcion    TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  categoria_id   BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
  direccion      TEXT,
  lat            DECIMAL(10,8),
  lng            DECIMAL(11,8),
  telefono       TEXT,
  whatsapp       TEXT,
  email          TEXT,
  horarios       JSONB,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','activo','suspendido','inactivo')),
  plan_id        BIGINT REFERENCES public.planes_suscripcion(id) ON DELETE SET NULL,
  rating_avg     DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at     TIMESTAMPTZ
);
GRANT SELECT ON public.comercios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comercios TO authenticated;
GRANT ALL ON public.comercios TO service_role;
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_comercios_zona ON public.comercios(zona_id);
CREATE INDEX idx_comercios_categoria ON public.comercios(categoria_id);
CREATE INDEX idx_comercios_estado ON public.comercios(estado);
CREATE INDEX idx_comercios_owner ON public.comercios(owner_id);

CREATE POLICY "Comercios activos son visibles" ON public.comercios
  FOR SELECT USING (
    (estado = 'activo' AND deleted_at IS NULL)
    OR owner_id = auth.uid()
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Usuarios autenticados crean sus comercios" ON public.comercios
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Dueños actualizan sus comercios" ON public.comercios
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Dueños y admins eliminan comercios" ON public.comercios
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Trigger updated_at compartido
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comercios_updated_at
  BEFORE UPDATE ON public.comercios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
