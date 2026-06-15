import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

export const Route = createFileRoute("/api/admin/dashboard")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const desde30 = new Date(Date.now() - 30 * 86400000).toISOString();
          const now = new Date().toISOString();

          const [
            comerciosTotal,
            comerciosActivos,
            comerciosPendientes,
            usuariosTotal,
            usuariosNuevos30,
            productosTotal,
            promocionesActivas,
            consultasNuevas,
            calificaciones,
          ] = await Promise.all([
            supabaseAdmin.from("comercios").select("id", { count: "exact", head: true }).is("deleted_at", null),
            supabaseAdmin.from("comercios").select("id", { count: "exact", head: true }).eq("estado", "activo").is("deleted_at", null),
            supabaseAdmin.from("comercios").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", desde30),
            supabaseAdmin.from("productos").select("id", { count: "exact", head: true }).is("deleted_at", null),
            supabaseAdmin.from("promociones").select("id", { count: "exact", head: true }).eq("activa", true).lte("fecha_inicio", now).gte("fecha_fin", now),
            supabaseAdmin.from("consultas").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
            supabaseAdmin.from("calificaciones").select("rating"),
          ]);

          const ratings = (calificaciones.data || []).map((r: any) => r.rating);
          const ratingPromedio =
            ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

          return jsonResponse({
            comercios: {
              total: comerciosTotal.count ?? 0,
              activos: comerciosActivos.count ?? 0,
              pendientes: comerciosPendientes.count ?? 0,
            },
            usuarios: {
              total: usuariosTotal.count ?? 0,
              nuevos_30d: usuariosNuevos30.count ?? 0,
            },
            productos: productosTotal.count ?? 0,
            promociones_activas: promocionesActivas.count ?? 0,
            consultas_nuevas: consultasNuevas.count ?? 0,
            rating_promedio: Number(ratingPromedio.toFixed(2)),
            total_reviews: ratings.length,
          });
        } catch (e: any) {
          return errorResponse(e?.message || "Error al obtener dashboard");
        }
      },
    },
  },
});
