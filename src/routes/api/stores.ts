import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

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

export const Route = createFileRoute("/api/stores")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const zona = url.searchParams.get("zona");
          const categoria = url.searchParams.get("categoria");
          const lat = url.searchParams.get("lat");
          const lng = url.searchParams.get("lng");
          const radio = Number(url.searchParams.get("radio") || "10");

          const { supabasePublic } = await import("@/integrations/supabase/public.server");

          let query = supabasePublic
            .from("comercios")
            .select(
              "id, nombre, slug, descripcion, logo_url, banner_url, telefono, whatsapp, lat, lng, direccion, zona_id, categoria_id, rating_avg, total_reviews, horarios",
            )
            .eq("estado", "activo")
            .is("deleted_at", null);

          if (zona) query = query.eq("zona_id", Number(zona));
          if (categoria) query = query.eq("categoria_id", Number(categoria));

          const { data, error } = await query.limit(100);
          if (error) throw error;

          const latN = lat ? Number(lat) : null;
          const lngN = lng ? Number(lng) : null;

          const comercios = (data || [])
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

          return jsonResponse({ comercios });
        } catch (e: any) {
          return errorResponse("Error al listar comercios");
        }
      },
    },
  },
});
