import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/client/favorites")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("favoritos")
            .select(
              "*, comercios(id, nombre, slug, logo_url, banner_url, rating_avg), productos(id, nombre, slug, imagen_url, precio_base, precio_oferta, comercio_id)",
            )
            .eq("cliente_id", ctx.userId)
            .order("created_at", { ascending: false });
          if (error) throw error;
          return jsonResponse({ favoritos: data || [] });
        } catch (e: any) {
          return errorResponse(e?.message || "Error al obtener favoritos");
        }
      },
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { comercio_id, producto_id } = body || {};
          if (!comercio_id && !producto_id) {
            return errorResponse("Se requiere comercio_id o producto_id", 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("favoritos")
            .insert({
              cliente_id: ctx.userId,
              comercio_id: comercio_id || null,
              producto_id: producto_id || null,
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ favorito: data }, 201);
        } catch (e: any) {
          return errorResponse(e?.message || "Error al agregar favorito");
        }
      },
    },
  },
});
