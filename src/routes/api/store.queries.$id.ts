import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/queries/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { estado } = body || {};
          if (!estado || !["nuevo", "leido", "respondido"].includes(estado)) {
            return errorResponse("estado inválido", 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data: existing } = await supabaseAdmin
            .from("consultas")
            .select("id, comercios!inner(owner_id)")
            .eq("id", params.id)
            .maybeSingle();
          if (!existing || (existing as any).comercios?.owner_id !== ctx.userId) {
            return errorResponse("No autorizado", 403);
          }

          const { data, error } = await supabaseAdmin
            .from("consultas")
            .update({ estado })
            .eq("id", params.id)
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ consulta: data });
        } catch (e: any) {
          return errorResponse("Error al actualizar consulta");
        }
      },
    },
  },
});
