import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/products/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: producto, error } = await supabaseAdmin
            .from("productos")
            .select(
              `
              id, nombre, slug, descripcion, marca, precio_base, precio_oferta,
              imagen_url, imagenes, comercio_id, categoria_id, destacado, disponible,
              stock, tags, atributos, vistas, created_at, updated_at,
              comercios(
                id, nombre, slug, descripcion, logo_url, banner_url, direccion,
                lat, lng, telefono, whatsapp, horarios, rating_avg, total_reviews,
                categoria_id, tour_360_url,
                recogida_disponible, recogida_notas,
                domicilio_disponible, domicilio_notas,
                disponibilidad_notas, confianza_notas
              ),
              categorias(id, nombre, slug)
            `,
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
