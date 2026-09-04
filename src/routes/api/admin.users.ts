import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { APP_ROLES, requireAdmin, requireSuperAdmin } from "@/lib/api-auth";
import { requestAuditContext } from "@/lib/audit.server";

const MIN_REASON_LENGTH = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const role = url.searchParams.get("role");
          const q = url.searchParams.get("q");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let query = supabaseAdmin
            .from("profiles")
            .select(
              "id, full_name, phone, avatar_url, role, account_status, suspended_at, suspension_reason, created_at",
            )
            .order("created_at", { ascending: false });
          if (role) query = query.eq("role", role);
          if (q) query = query.ilike("full_name", `%${q}%`);
          const { data, error } = await query.limit(200);
          if (error) throw error;
          return jsonResponse({ usuarios: data || [] });
        } catch {
          return errorResponse("Error al listar usuarios");
        }
      },
      PUT: async ({ request }) => {
        try {
          const ctx = await requireSuperAdmin(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { id, role, reason } = body || {};
          if (!UUID_PATTERN.test(String(id)) || !APP_ROLES.includes(role)) {
            return errorResponse("id y role valido son requeridos", 400);
          }
          if (id === ctx.userId) return errorResponse("No puedes modificar tu propio rol", 403);
          if (typeof reason !== "string" || reason.trim().length < MIN_REASON_LENGTH) {
            return errorResponse("reason debe tener al menos 10 caracteres", 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const audit = requestAuditContext(request);
          const { data, error } = await supabaseAdmin.rpc("admin_change_profile_role", {
            p_actor_id: ctx.userId,
            p_target_id: id,
            p_new_role: role,
            p_reason: reason.trim(),
            p_request_id: audit.requestId,
            p_ip_address: audit.ipAddress,
            p_user_agent: audit.userAgent,
          });
          if (error) throw error;
          return jsonResponse({ usuario: data });
        } catch {
          return errorResponse("Error al actualizar usuario");
        }
      },
    },
  },
});
