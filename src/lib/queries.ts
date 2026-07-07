import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Producto = {
  id: string;
  nombre: string;
  slug: string;
  precio_base: number;
  precio_oferta: number | null;
  imagen_url: string | null;
  comercio_id: string;
  categoria_id: number | null;
  destacado: boolean;
  disponible: boolean;
  distancia_km?: number | null;
  comercios?: { nombre: string; slug: string; lat?: number | null; lng?: number | null } | null;
};

export type Comercio = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  direccion: string | null;
  categoria_id: number | null;
  rating_avg: number | null;
  total_reviews: number | null;
  tour_360_url: string | null;
  lat?: number | null;
  lng?: number | null;
  distancia_km?: number | null;
  categorias?: { nombre: string } | null;
};

export type Categoria = {
  id: number;
  nombre: string;
  slug: string;
  orden: number | null;
};

export type Promocion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  valor: number | null;
  imagen_url: string | null;
  comercio_id: string;
  comercios?: { nombre: string; slug: string } | null;
};

export const categoriasQuery = queryOptions({
  queryKey: ["categorias"],
  queryFn: async (): Promise<Categoria[]> => {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, slug, orden")
      .eq("activa", true)
      .order("orden", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Categoria[];
  },
  staleTime: 5 * 60_000,
});

export const productosDestacadosQuery = queryOptions({
  queryKey: ["productos", "destacados"],
  queryFn: async (): Promise<Producto[]> => {
    const { data, error } = await supabase
      .from("productos")
      .select(
        "id, nombre, slug, precio_base, precio_oferta, imagen_url, comercio_id, categoria_id, destacado, disponible, comercios(nombre, slug)",
      )
      .eq("destacado", true)
      .eq("disponible", true)
      .is("deleted_at", null)
      .limit(8);
    if (error) throw error;
    return (data ?? []) as unknown as Producto[];
  },
  staleTime: 60_000,
});

export const promocionesDestacadasQuery = queryOptions({
  queryKey: ["promociones", "destacadas"],
  queryFn: async (): Promise<Promocion[]> => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("promociones")
      .select(
        "id, titulo, descripcion, tipo, valor, imagen_url, comercio_id, comercios(nombre, slug)",
      )
      .eq("destacada", true)
      .eq("activa", true)
      .lte("fecha_inicio", nowIso)
      .gte("fecha_fin", nowIso)
      .limit(12);
    if (error) throw error;
    return (data ?? []) as unknown as Promocion[];
  },
  staleTime: 60_000,
});

export const comerciosDestacadosQuery = queryOptions({
  queryKey: ["comercios", "destacados"],
  queryFn: async (): Promise<Comercio[]> => {
    const { data, error } = await supabase
      .from("comercios")
      .select(
        "id, nombre, slug, logo_url, direccion, categoria_id, rating_avg, total_reviews, tour_360_url, categorias(nombre)",
      )
      .eq("estado", "activo")
      .is("deleted_at", null)
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []) as unknown as Comercio[];
  },
  staleTime: 60_000,
});

export type SearchFilters = {
  q: string;
  categoria: number | null;
  precioMin: number | null;
  precioMax: number | null;
  conPromo: boolean;
  disponibles: boolean;
  lat?: number | null;
  lng?: number | null;
  radioKm?: number | null;
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function withDistance<T extends { lat?: number | null; lng?: number | null }>(
  rows: T[],
  filters: Pick<SearchFilters, "lat" | "lng" | "radioKm">,
) {
  const lat = filters.lat ?? null;
  const lng = filters.lng ?? null;
  const radioKm = filters.radioKm ?? 10;
  if (lat == null || lng == null) return rows.map((row) => ({ ...row, distancia_km: null }));

  return rows
    .map((row) => {
      const distancia =
        row.lat != null && row.lng != null
          ? distanceKm(lat, lng, Number(row.lat), Number(row.lng))
          : null;
      return { ...row, distancia_km: distancia };
    })
    .filter((row) => row.distancia_km == null || row.distancia_km <= radioKm)
    .sort((a, b) => {
      if (a.distancia_km == null && b.distancia_km == null) return 0;
      if (a.distancia_km == null) return 1;
      if (b.distancia_km == null) return -1;
      return a.distancia_km - b.distancia_km;
    });
}

export function buildSearchProductsQuery(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["search", "productos", filters],
    queryFn: async (): Promise<Producto[]> => {
      let q = supabase
        .from("productos")
        .select(
          "id, nombre, slug, precio_base, precio_oferta, imagen_url, comercio_id, categoria_id, destacado, disponible, comercios(nombre, slug, lat, lng)",
          { count: "exact" },
        )
        .is("deleted_at", null);

      if (filters.disponibles) q = q.eq("disponible", true);
      if (filters.q.trim()) q = q.ilike("nombre", `%${filters.q.trim()}%`);
      if (filters.categoria) q = q.eq("categoria_id", filters.categoria);
      if (filters.precioMin != null) q = q.gte("precio_base", filters.precioMin);
      if (filters.precioMax != null) q = q.lte("precio_base", filters.precioMax);
      if (filters.conPromo) q = q.not("precio_oferta", "is", null);

      const { data, error } = await q.limit(60);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Producto[];
      return withDistance(
        rows.map((p) => ({
          ...p,
          lat: p.comercios?.lat ?? null,
          lng: p.comercios?.lng ?? null,
        })),
        filters,
      ).map(({ lat: _lat, lng: _lng, ...p }) => p);
    },
    staleTime: 15_000,
  });
}

export function buildSearchComerciosQuery(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["search", "comercios", filters],
    queryFn: async (): Promise<Comercio[]> => {
      let q = supabase
        .from("comercios")
        .select(
          "id, nombre, slug, logo_url, direccion, lat, lng, categoria_id, rating_avg, total_reviews, tour_360_url, categorias(nombre)",
        )
        .eq("estado", "activo")
        .is("deleted_at", null);

      if (filters.q.trim()) q = q.ilike("nombre", `%${filters.q.trim()}%`);
      if (filters.categoria) q = q.eq("categoria_id", filters.categoria);

      const { data, error } = await q
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .limit(60);
      if (error) throw error;
      return withDistance((data ?? []) as unknown as Comercio[], filters);
    },
    staleTime: 15_000,
  });
}

// ============================ DETAIL QUERIES ============================

export type ComercioFull = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo_url: string | null;
  banner_url: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  whatsapp: string | null;
  horarios: Record<string, string> | null;
  rating_avg: number | null;
  total_reviews: number | null;
  categoria_id: number | null;
  tour_360_url: string | null;
  recogida_disponible: boolean | null;
  recogida_notas: string | null;
  domicilio_disponible: boolean | null;
  domicilio_notas: string | null;
  disponibilidad_notas: string | null;
  confianza_notas: string | null;
  categorias?: { nombre: string; slug: string } | null;
};

export type ProductoFull = Producto & {
  descripcion: string | null;
  marca: string | null;
  imagenes: string[] | null;
  stock: number | null;
  tags: string[] | null;
  atributos: Record<string, string> | null;
  comercios?:
    | (Comercio & {
        whatsapp?: string | null;
        telefono?: string | null;
        horarios?: Record<string, string> | null;
        lat?: number | null;
        lng?: number | null;
        descripcion?: string | null;
        recogida_disponible?: boolean | null;
        recogida_notas?: string | null;
        domicilio_disponible?: boolean | null;
        domicilio_notas?: string | null;
        disponibilidad_notas?: string | null;
        confianza_notas?: string | null;
      })
    | null;
};

export function productoByIdQuery(id: string) {
  return queryOptions({
    queryKey: ["producto", id],
    queryFn: async (): Promise<ProductoFull | null> => {
      const { data, error } = await supabase
        .from("productos")
        .select(
          `
          id, nombre, slug, descripcion, marca, precio_base, precio_oferta,
          imagen_url, imagenes, comercio_id, categoria_id, destacado, disponible,
          stock, tags, atributos,
          comercios(
            id, nombre, slug, descripcion, logo_url, banner_url, direccion,
            lat, lng, telefono, whatsapp, horarios, rating_avg, total_reviews,
            categoria_id, tour_360_url,
            recogida_disponible, recogida_notas,
            domicilio_disponible, domicilio_notas,
            disponibilidad_notas, confianza_notas,
            categorias(nombre, slug)
          )
        `,
        )
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ProductoFull | null;
    },
  });
}

export function comercioBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["comercio", slug],
    queryFn: async (): Promise<ComercioFull | null> => {
      const { data, error } = await supabase
        .from("comercios")
        .select(
          `
          id, nombre, slug, descripcion, logo_url, banner_url, direccion,
          lat, lng, telefono, whatsapp, horarios, rating_avg, total_reviews,
          categoria_id, tour_360_url,
          recogida_disponible, recogida_notas,
          domicilio_disponible, domicilio_notas,
          disponibilidad_notas, confianza_notas,
          categorias(nombre, slug)
        `,
        )
        .eq("slug", slug)
        .eq("estado", "activo")
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ComercioFull | null;
    },
  });
}

export function productosByComercioQuery(
  comercioId: string,
  opts?: { excludeId?: string; limit?: number },
) {
  const key = ["productos", "by-comercio", comercioId, opts?.excludeId ?? null, opts?.limit ?? 200];
  return queryOptions({
    queryKey: key,
    queryFn: async (): Promise<Producto[]> => {
      let q = supabase
        .from("productos")
        .select(
          "id, nombre, slug, precio_base, precio_oferta, imagen_url, comercio_id, categoria_id, destacado, disponible",
        )
        .eq("comercio_id", comercioId)
        .eq("disponible", true)
        .is("deleted_at", null);
      if (opts?.excludeId) q = q.neq("id", opts.excludeId);
      const { data, error } = await q.limit(opts?.limit ?? 200);
      if (error) throw error;
      return (data ?? []) as Producto[];
    },
  });
}

export function promocionesByComercioQuery(comercioId: string, limit = 20) {
  return queryOptions({
    queryKey: ["promociones", "by-comercio", comercioId, limit],
    queryFn: async (): Promise<(Promocion & { fecha_fin: string })[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("promociones")
        .select("id, titulo, descripcion, tipo, valor, imagen_url, comercio_id, fecha_fin")
        .eq("comercio_id", comercioId)
        .eq("activa", true)
        .lte("fecha_inicio", nowIso)
        .gte("fecha_fin", nowIso)
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as (Promocion & { fecha_fin: string })[];
    },
  });
}

export type Resena = {
  id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export function resenasByComercioQuery(comercioId: string) {
  return queryOptions({
    queryKey: ["resenas", comercioId],
    queryFn: async (): Promise<Resena[]> => {
      const { data, error } = await supabase
        .from("calificaciones")
        .select("id, rating, comentario, created_at, profiles(full_name, avatar_url)")
        .eq("comercio_id", comercioId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Resena[];
    },
  });
}

export function myReviewQuery(comercioId: string, userId: string | null | undefined) {
  return queryOptions({
    queryKey: ["my-review", comercioId, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("calificaciones")
        .select("id, rating, comentario, created_at")
        .eq("comercio_id", comercioId)
        .eq("cliente_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
