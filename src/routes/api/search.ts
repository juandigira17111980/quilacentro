import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

// Haversine distance in km
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

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const q = (url.searchParams.get("q") || "").trim();
          const categoria = url.searchParams.get("categoria");
          const zona = url.searchParams.get("zona");
          const precioMin = url.searchParams.get("precio_min");
          const precioMax = url.searchParams.get("precio_max");
          const lat = url.searchParams.get("lat");
          const lng = url.searchParams.get("lng");
          const radio = Number(url.searchParams.get("radio") || "10");

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // Productos
          let prodQuery = supabaseAdmin
            .from("productos")
            .select(
              "id, nombre, slug, descripcion, precio_base, precio_oferta, imagen_url, marca, comercio_id, categoria_id, comercios!inner(id, nombre, slug, lat, lng, zona_id, estado)",
            )
            .eq("disponible", true)
            .is("deleted_at", null)
            .eq("comercios.estado", "activo");

          if (q) prodQuery = prodQuery.ilike("nombre", `%${q}%`);
          if (categoria) prodQuery = prodQuery.eq("categoria_id", Number(categoria));
          if (zona) prodQuery = prodQuery.eq("comercios.zona_id", Number(zona));
          if (precioMin) prodQuery = prodQuery.gte("precio_base", Number(precioMin));
          if (precioMax) prodQuery = prodQuery.lte("precio_base", Number(precioMax));

          const { data: productos, error: prodErr } = await prodQuery.limit(50);
          if (prodErr) throw prodErr;

          // Comercios
          let comQuery = supabaseAdmin
            .from("comercios")
            .select(
              "id, nombre, slug, descripcion, logo_url, banner_url, lat, lng, zona_id, categoria_id, rating_avg, total_reviews",
            )
            .eq("estado", "activo")
            .is("deleted_at", null);

          if (q) comQuery = comQuery.ilike("nombre", `%${q}%`);
          if (categoria) comQuery = comQuery.eq("categoria_id", Number(categoria));
          if (zona) comQuery = comQuery.eq("zona_id", Number(zona));

          const { data: comercios, error: comErr } = await comQuery.limit(50);
          if (comErr) throw comErr;

          // Ranking por distancia
          const latN = lat ? Number(lat) : null;
          const lngN = lng ? Number(lng) : null;

          const productosRanked = (productos || [])
            .map((p: any) => {
              const c = p.comercios;
              const dist =
                latN !== null && lngN !== null && c?.lat && c?.lng
                  ? distanceKm(latN, lngN, Number(c.lat), Number(c.lng))
                  : null;
              return { ...p, distancia_km: dist };
            })
            .filter((p: any) => latN === null || p.distancia_km === null || p.distancia_km <= radio)
            .sort((a: any, b: any) => {
              if (a.distancia_km === null && b.distancia_km === null) return 0;
              if (a.distancia_km === null) return 1;
              if (b.distancia_km === null) return -1;
              return a.distancia_km - b.distancia_km;
            });

          const comerciosRanked = (comercios || [])
            .map((c: any) => {
              const dist =
                latN !== null && lngN !== null && c.lat && c.lng
                  ? distanceKm(latN, lngN, Number(c.lat), Number(c.lng))
                  : null;
              return { ...c, distancia_km: dist };
            })
            .filter((c: any) => latN === null || c.distancia_km === null || c.distancia_km <= radio)
            .sort((a: any, b: any) => {
              if (a.distancia_km === null && b.distancia_km === null)
                return (b.rating_avg || 0) - (a.rating_avg || 0);
              if (a.distancia_km === null) return 1;
              if (b.distancia_km === null) return -1;
              return a.distancia_km - b.distancia_km;
            });

          return jsonResponse({
            productos: productosRanked,
            comercios: comerciosRanked,
          });
        } catch (e: any) {
          return errorResponse("Error en búsqueda");
        }
      },
    },
  },
});
