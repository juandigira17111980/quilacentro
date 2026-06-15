import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

const ESTADOS = ["pendiente", "activo", "suspendido", "inactivo"] as const;

export const Route = createFileRoute("/api/admin/stores/$id/status")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { estado } = body || {};
          if (!estado || !ESTADOS.includes(estado)) {
            return errorResponse(
              `estado debe ser uno de: ${ESTADOS.join(", ")}`,
              400,
            );
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("comercios")
            .update({ estado })
            .eq("id", params.id)
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ comercio: data });
        } catch (e: any) {
          return errorResponse("Error al actualizar estado");
        }
      },
    },
  },
});
