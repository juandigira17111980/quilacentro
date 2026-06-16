import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MyComercio = {
  id: string;
  owner_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo_url: string | null;
  banner_url: string | null;
  categoria_id: number | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  horarios: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  estado: string;
  plan_id: number | null;
  rating_avg: number | null;
  total_reviews: number | null;
  tour_360_url: string | null;
};

export type MyProducto = {
  id: string;
  comercio_id: string;
  categoria_id: number | null;
  nombre: string;
  slug: string;
  descripcion: string | null;
  marca: string | null;
  sku: string | null;
  precio_base: number;
  precio_oferta: number | null;
  imagen_url: string | null;
  imagenes: string[];
  disponible: boolean;
  destacado: boolean;
  stock: number | null;
  tags: string[] | null;
  atributos: Record<string, string> | null;
};

export type MyPromocion = {
  id: string;
  comercio_id: string;
  producto_id: string | null;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  valor: number | null;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  destacada: boolean;
};

export type MyConsulta = {
  id: string;
  cliente_id: string | null;
  comercio_id: string;
  producto_id: string | null;
  mensaje: string;
  canal: string;
  estado: "nuevo" | "leido" | "respondido";
  created_at: string;
  profiles?: { full_name: string | null } | null;
  productos?: { nombre: string } | null;
};

export function myComercioQuery(ownerId: string) {
  return queryOptions({
    queryKey: ["my-comercio", ownerId],
    queryFn: async (): Promise<MyComercio | null> => {
      const { data, error } = await supabase
        .from("comercios")
        .select("*")
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as MyComercio | null;
    },
  });
}

export function myProductsQuery(comercioId: string | null | undefined) {
  return queryOptions({
    queryKey: ["my-products", comercioId],
    enabled: !!comercioId,
    queryFn: async (): Promise<MyProducto[]> => {
      if (!comercioId) return [];
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("comercio_id", comercioId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyProducto[];
    },
  });
}

export function myPromotionsQuery(comercioId: string | null | undefined) {
  return queryOptions({
    queryKey: ["my-promotions", comercioId],
    enabled: !!comercioId,
    queryFn: async (): Promise<MyPromocion[]> => {
      if (!comercioId) return [];
      const { data, error } = await supabase
        .from("promociones")
        .select("*")
        .eq("comercio_id", comercioId)
        .order("fecha_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyPromocion[];
    },
  });
}

export function myQueriesQuery(comercioId: string | null | undefined) {
  return queryOptions({
    queryKey: ["my-queries", comercioId],
    enabled: !!comercioId,
    queryFn: async (): Promise<MyConsulta[]> => {
      if (!comercioId) return [];
      const { data, error } = await supabase
        .from("consultas")
        .select("*, profiles(full_name), productos(nombre)")
        .eq("comercio_id", comercioId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as MyConsulta[];
    },
  });
}

export function myPlanQuery(planId: number | null | undefined) {
  return queryOptions({
    queryKey: ["plan", planId],
    enabled: !!planId,
    queryFn: async () => {
      if (!planId) return null;
      const { data, error } = await supabase
        .from("planes_suscripcion")
        .select("id, nombre, max_productos, destacados_mes")
        .eq("id", planId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export const categoriasAllQuery = queryOptions({
  queryKey: ["categorias-all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, slug")
      .eq("activa", true)
      .order("orden", { ascending: true });
    if (error) throw error;
    return (data ?? []) as { id: number; nombre: string; slug: string }[];
  },
  staleTime: 5 * 60_000,
});
