import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";
import { requestAuditContext } from "@/lib/audit.server";

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
          const { estado, reason } = body || {};
          if (!estado || !ESTADOS.includes(estado)) {
            return errorResponse(`estado debe ser uno de: ${ESTADOS.join(", ")}`, 400);
          }
          if (
            ["suspendido", "inactivo"].includes(estado) &&
            (typeof reason !== "string" || reason.trim().length < 10)
          ) {
            return errorResponse("reason debe tener al menos 10 caracteres", 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const audit = requestAuditContext(request);
          const { data, error } = await supabaseAdmin.rpc("admin_change_store_status", {
            p_actor_id: ctx.userId,
            p_store_id: params.id,
            p_estado: estado,
            p_reason: typeof reason === "string" ? reason.trim() : null,
            p_request_id: audit.requestId,
            p_ip_address: audit.ipAddress,
            p_user_agent: audit.userAgent,
          });
          if (error) throw error;
          return jsonResponse({ comercio: data });
        } catch {
          return errorResponse("Error al actualizar estado");
        }
      },
    },
  },
});
