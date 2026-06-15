import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/client/favorites/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      DELETE: async ({ request, params }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error } = await supabaseAdmin
            .from("favoritos")
            .delete()
            .eq("id", params.id)
            .eq("cliente_id", ctx.userId);
          if (error) throw error;
          return jsonResponse({ ok: true });
        } catch (e: any) {
          return errorResponse(e?.message || "Error al eliminar favorito");
        }
      },
    },
  },
});
