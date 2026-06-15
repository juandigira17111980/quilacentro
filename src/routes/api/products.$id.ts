import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/products/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data: producto, error } = await supabaseAdmin
            .from("productos")
            .select(
              "*, comercios(id, nombre, slug, descripcion, logo_url, banner_url, telefono, whatsapp, email, direccion, lat, lng, horarios, rating_avg, total_reviews, estado), categorias(id, nombre, slug)",
            )
            .eq("id", params.id)
            .eq("disponible", true)
            .is("deleted_at", null)
            .maybeSingle();

          if (error) throw error;
          if (!producto) return errorResponse("Producto no encontrado", 404);

          const now = new Date().toISOString();
          const { data: promociones } = await supabaseAdmin
            .from("promociones")
            .select("*")
            .eq("activa", true)
            .or(`producto_id.eq.${params.id},producto_id.is.null`)
            .eq("comercio_id", producto.comercio_id)
            .lte("fecha_inicio", now)
            .gte("fecha_fin", now);

          // Incrementar vistas (best-effort)
          await supabaseAdmin
            .from("productos")
            .update({ vistas: (producto.vistas || 0) + 1 })
            .eq("id", params.id);

          return jsonResponse({ producto, promociones: promociones || [] });
        } catch (e: any) {
          return errorResponse("Error al obtener producto");
        }
      },
    },
  },
});
