import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/promotions")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const zona = url.searchParams.get("zona");
          const categoria = url.searchParams.get("categoria");

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const now = new Date().toISOString();
          let query = supabaseAdmin
            .from("promociones")
            .select(
              "*, comercios!inner(id, nombre, slug, logo_url, zona_id, categoria_id, estado), productos(id, nombre, slug, imagen_url, precio_base, precio_oferta)",
            )
            .eq("activa", true)
            .eq("comercios.estado", "activo")
            .lte("fecha_inicio", now)
            .gte("fecha_fin", now)
            .order("destacada", { ascending: false })
            .order("fecha_inicio", { ascending: false });

          if (zona) query = query.eq("comercios.zona_id", Number(zona));
          if (categoria) query = query.eq("comercios.categoria_id", Number(categoria));

          const { data, error } = await query.limit(50);
          if (error) throw error;

          return jsonResponse({ promociones: data || [] });
        } catch (e: any) {
          return errorResponse("Error al listar promociones");
        }
      },
    },
  },
});
