import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireSuperAdmin } from "@/lib/api-auth";
import { requestAuditContext } from "@/lib/audit.server";

const ACCOUNT_STATUSES = ["activo", "suspendido"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/admin/users/$id/status")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        try {
          const ctx = await requireSuperAdmin(request);
          if (ctx instanceof Response) return ctx;
          if (!UUID_PATTERN.test(params.id)) return errorResponse("id invalido", 400);
          if (params.id === ctx.userId)
            return errorResponse("No puedes modificar tu propia cuenta", 403);

          const body = await request.json().catch(() => ({}));
          const { account_status: accountStatus, reason } = body || {};
          if (!ACCOUNT_STATUSES.includes(accountStatus)) {
            return errorResponse("account_status invalido", 400);
          }
          if (typeof reason !== "string" || reason.trim().length < 10) {
            return errorResponse("reason debe tener al menos 10 caracteres", 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const banDuration = accountStatus === "suspendido" ? "876000h" : "none";
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
            ban_duration: banDuration,
          });
          if (authError) throw authError;

          const audit = requestAuditContext(request);
          const { data, error } = await supabaseAdmin.rpc("admin_set_account_status", {
            p_actor_id: ctx.userId,
            p_target_id: params.id,
            p_account_status: accountStatus,
            p_reason: reason.trim(),
            p_request_id: audit.requestId,
            p_ip_address: audit.ipAddress,
            p_user_agent: audit.userAgent,
          });
          if (error) {
            await supabaseAdmin.auth.admin.updateUserById(params.id, {
              ban_duration: accountStatus === "suspendido" ? "none" : "876000h",
            });
            throw error;
          }

          return jsonResponse({ usuario: data });
        } catch {
          return errorResponse("Error al actualizar estado de cuenta");
        }
      },
    },
  },
});
