import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin, requireSuperAdmin } from "@/lib/api-auth";
import { requestAuditContext } from "@/lib/audit.server";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const uuid = z.string().uuid();
const updateSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30).nullable(),
  reason: z.string().trim().min(10).max(500),
});

export const Route = createFileRoute("/api/admin/users/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request, params }) => {
        const ctx = await requireAdmin(request);
        if (ctx instanceof Response) return ctx;
        if (!uuid.safeParse(params.id).success) return errorResponse("Usuario inválido", 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [profileResult, authResult] = await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("id, full_name, phone, role, account_status, created_at")
            .eq("id", params.id)
            .maybeSingle(),
          supabaseAdmin.auth.admin.getUserById(params.id),
        ]);
        if (profileResult.error || authResult.error)
          return errorResponse("No se pudo consultar la cuenta");
        if (!profileResult.data || !authResult.data.user)
          return errorResponse("Usuario no encontrado", 404);
        const response = jsonResponse({
          usuario: { ...profileResult.data, email: authResult.data.user.email },
        });
        response.headers.set("Cache-Control", "no-store");
        return response;
      },
      PATCH: async ({ request, params }) => {
        const ctx = await requireSuperAdmin(request);
        if (ctx instanceof Response) return ctx;
        if (!uuid.safeParse(params.id).success) return errorResponse("Usuario inválido", 400);
        const parsed = updateSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Revisa nombre, teléfono y motivo", 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const audit = requestAuditContext(request);
        const { data, error } = await supabaseAdmin.rpc("admin_update_profile_details", {
          p_actor_id: ctx.userId,
          p_target_id: params.id,
          p_full_name: parsed.data.full_name,
          p_phone: parsed.data.phone,
          p_reason: parsed.data.reason,
          p_request_id: audit.requestId,
          p_ip_address: audit.ipAddress,
          p_user_agent: audit.userAgent,
        });
        if (error) return errorResponse("No se pudo actualizar el perfil", 400);
        return jsonResponse({
          usuario: { id: data.id, full_name: data.full_name, phone: data.phone },
        });
      },
    },
  },
});
