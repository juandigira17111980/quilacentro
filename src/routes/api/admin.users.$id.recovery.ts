import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireSuperAdmin } from "@/lib/api-auth";
import { recordAdminAuditEvent } from "@/lib/audit.server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/admin/users/$id/recovery")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request, params }) => {
        try {
          const ctx = await requireSuperAdmin(request);
          if (ctx instanceof Response) return ctx;
          if (!UUID_PATTERN.test(params.id)) return errorResponse("id invalido", 400);

          const body = await request.json().catch(() => ({}));
          const reason = body?.reason;
          if (typeof reason !== "string" || reason.trim().length < 10) {
            return errorResponse("reason debe tener al menos 10 caracteres", 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, account_status")
            .eq("id", params.id)
            .maybeSingle();
          if (profileError) throw profileError;
          if (!profile) return errorResponse("Usuario no encontrado", 404);
          if (profile.account_status !== "activo") {
            return errorResponse("Reactiva la cuenta antes de solicitar recuperacion", 409);
          }

          const { data: userResult, error: userError } = await supabaseAdmin.auth.admin.getUserById(
            params.id,
          );
          if (userError) throw userError;
          if (!userResult.user.email)
            return errorResponse("El usuario no tiene email recuperable", 409);

          const appUrl = process.env.APP_URL;
          if (!appUrl) return errorResponse("APP_URL no esta configurado", 500);

          const { error: recoveryError } = await supabaseAdmin.auth.resetPasswordForEmail(
            userResult.user.email,
            { redirectTo: `${appUrl.replace(/\/$/, "")}/auth` },
          );
          if (recoveryError) throw recoveryError;

          await recordAdminAuditEvent({
            actorId: ctx.userId,
            action: "identity.recovery_requested",
            resourceType: "profile",
            resourceId: params.id,
            reason: reason.trim(),
            request,
          });

          return jsonResponse({ ok: true });
        } catch {
          return errorResponse("Error al solicitar recuperacion de cuenta");
        }
      },
    },
  },
});
