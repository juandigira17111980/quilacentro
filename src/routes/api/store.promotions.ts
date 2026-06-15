import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/promotions")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const {
            comercio_id,
            producto_id,
            titulo,
            descripcion,
            tipo,
            valor,
            imagen_url,
            fecha_inicio,
            fecha_fin,
            activa,
            destacada,
          } = body || {};

          if (!titulo || !tipo || !fecha_inicio || !fecha_fin) {
            return errorResponse("titulo, tipo, fecha_inicio y fecha_fin son requeridos", 400);
          }

          const comercio = await getOwnedComercio(ctx, comercio_id);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("promociones")
            .insert({
              comercio_id: comercio.id,
              producto_id,
              titulo,
              descripcion,
              tipo,
              valor,
              imagen_url,
              fecha_inicio,
              fecha_fin,
              activa: activa ?? true,
              destacada: destacada ?? false,
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ promocion: data }, 201);
        } catch (e: any) {
          return errorResponse(e?.message || "Error al crear promoción");
        }
      },
    },
  },
});
