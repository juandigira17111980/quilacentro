import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/promotions/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data: existing } = await supabaseAdmin
            .from("promociones")
            .select("id, comercios!inner(owner_id)")
            .eq("id", params.id)
            .maybeSingle();
          if (!existing || (existing as any).comercios?.owner_id !== ctx.userId) {
            return errorResponse("No autorizado", 403);
          }

          const body = await request.json().catch(() => ({}));
          const allowed = [
            "producto_id",
            "titulo",
            "descripcion",
            "tipo",
            "valor",
            "imagen_url",
            "fecha_inicio",
            "fecha_fin",
            "activa",
            "destacada",
          ];
          const updates: Record<string, unknown> = {};
          for (const k of allowed) if (k in body) updates[k] = body[k];

          const { data, error } = await supabaseAdmin
            .from("promociones")
            .update(updates as never)
            .eq("id", params.id)
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ promocion: data });
        } catch (e: any) {
          return errorResponse("Error al actualizar promoción");
        }
      },
    },
  },
});
