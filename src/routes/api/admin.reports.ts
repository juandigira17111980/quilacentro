import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

export const Route = createFileRoute("/api/admin/reports")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const dias = Number(url.searchParams.get("dias") || "30");
          const desde = new Date(Date.now() - dias * 86400000).toISOString();

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const [
            topComerciosRes,
            topProductosRes,
            topCategoriasRes,
            topZonasRes,
            busquedasRes,
            usuariosPorRolRes,
          ] = await Promise.all([
            supabaseAdmin
              .from("comercios")
              .select("id, nombre, slug, rating_avg, total_reviews")
              .eq("estado", "activo")
              .order("rating_avg", { ascending: false })
              .order("total_reviews", { ascending: false })
              .limit(10),
            supabaseAdmin
              .from("productos")
              .select("id, nombre, slug, vistas, comercio_id")
              .is("deleted_at", null)
              .order("vistas", { ascending: false })
              .limit(10),
            supabaseAdmin
              .from("comercios")
              .select("categoria_id, categorias(nombre)")
              .eq("estado", "activo"),
            supabaseAdmin
              .from("comercios")
              .select("zona_id, zonas(nombre, ciudad)")
              .eq("estado", "activo"),
            supabaseAdmin
              .from("historial_busquedas")
              .select("termino")
              .gte("created_at", desde)
              .limit(1000),
            supabaseAdmin.from("profiles").select("role"),
          ]);

          // Agregar conteos
          const countBy = <T,>(arr: T[] | null, key: (x: T) => string | null) => {
            const m = new Map<string, number>();
            (arr || []).forEach((x) => {
              const k = key(x);
              if (k) m.set(k, (m.get(k) || 0) + 1);
            });
            return Array.from(m, ([nombre, count]) => ({ nombre, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
          };

          return jsonResponse({
            periodo_dias: dias,
            top_comercios: topComerciosRes.data || [],
            top_productos: topProductosRes.data || [],
            top_categorias: countBy(
              topCategoriasRes.data,
              (x: any) => x.categorias?.nombre || null,
            ),
            top_zonas: countBy(
              topZonasRes.data,
              (x: any) =>
                x.zonas ? `${x.zonas.nombre} (${x.zonas.ciudad})` : null,
            ),
            top_busquedas: countBy(busquedasRes.data, (x: any) => x.termino),
            usuarios_por_rol: countBy(usuariosPorRolRes.data, (x: any) => x.role),
          });
        } catch (e: any) {
          return errorResponse("Error al generar reporte");
        }
      },
    },
  },
});
