import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/stats")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const comercioId = url.searchParams.get("comercio_id");
          const comercio = await getOwnedComercio(ctx, comercioId);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const now = new Date().toISOString();
          const desde30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

          const [
            productosRes,
            promocionesRes,
            consultasNuevasRes,
            consultasTotalRes,
            calificacionesRes,
            favoritosRes,
            consultas30Res,
            vistasRes,
          ] = await Promise.all([
            supabaseAdmin
              .from("productos")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .is("deleted_at", null),
            supabaseAdmin
              .from("promociones")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .eq("activa", true)
              .lte("fecha_inicio", now)
              .gte("fecha_fin", now),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .eq("estado", "nuevo"),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id),
            supabaseAdmin
              .from("calificaciones")
              .select("rating")
              .eq("comercio_id", comercio.id),
            supabaseAdmin
              .from("favoritos")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .gte("created_at", desde30),
            supabaseAdmin
              .from("productos")
              .select("vistas")
              .eq("comercio_id", comercio.id)
              .is("deleted_at", null),
          ]);

          const ratings = (calificacionesRes.data || []).map((r: any) => r.rating);
          const ratingAvg =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          const totalVistas = (vistasRes.data || []).reduce(
            (a, p: any) => a + (p.vistas || 0),
            0,
          );

          return jsonResponse({
            comercio_id: comercio.id,
            productos: productosRes.count ?? 0,
            promociones_activas: promocionesRes.count ?? 0,
            consultas_nuevas: consultasNuevasRes.count ?? 0,
            consultas_total: consultasTotalRes.count ?? 0,
            consultas_30d: consultas30Res.count ?? 0,
            favoritos: favoritosRes.count ?? 0,
            rating_promedio: Number(ratingAvg.toFixed(2)),
            total_reviews: ratings.length,
            vistas_totales: totalVistas,
          });
        } catch (e: any) {
          return errorResponse("Error al obtener estadísticas");
        }
      },
    },
  },
});
