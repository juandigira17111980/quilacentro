import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/stores/$slug")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data: comercio, error } = await supabaseAdmin
            .from("comercios")
            .select(
              "*, categorias(id, nombre, slug), zonas(id, nombre, ciudad, departamento)",
            )
            .eq("slug", params.slug)
            .eq("estado", "activo")
            .is("deleted_at", null)
            .maybeSingle();

          if (error) throw error;
          if (!comercio) return errorResponse("Comercio no encontrado", 404);

          const now = new Date().toISOString();
          const [{ data: productos }, { data: promociones }] = await Promise.all([
            supabaseAdmin
              .from("productos")
              .select("*")
              .eq("comercio_id", comercio.id)
              .eq("disponible", true)
              .is("deleted_at", null)
              .order("destacado", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(100),
            supabaseAdmin
              .from("promociones")
              .select("*")
              .eq("comercio_id", comercio.id)
              .eq("activa", true)
              .lte("fecha_inicio", now)
              .gte("fecha_fin", now),
          ]);

          return jsonResponse({
            comercio,
            productos: productos || [],
            promociones: promociones || [],
          });
        } catch (e: any) {
          return errorResponse("Error al obtener comercio");
        }
      },
    },
  },
});
