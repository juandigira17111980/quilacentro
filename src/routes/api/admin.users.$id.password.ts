import { randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api-auth";
import { recordAdminAuditEvent } from "@/lib/audit.server";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const schema = z.object({ reason: z.string().trim().min(10).max(500) });

export const Route = createFileRoute("/api/admin/users/$id/password")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request, params }) => {
        const ctx = await requireSuperAdmin(request);
        if (ctx instanceof Response) return ctx;
        if (!z.string().uuid().safeParse(params.id).success)
          return errorResponse("Usuario inválido", 400);
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return errorResponse("Indica un motivo de al menos 10 caracteres", 400);

        try {
          if (
            !(await enforceRateLimit(request, {
              scope: `admin-password:${ctx.userId}`,
              limit: 10,
              windowSeconds: 3600,
            }))
          ) {
            return errorResponse("Demasiados cambios de clave. Intenta más tarde", 429);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, account_status")
            .eq("id", params.id)
            .maybeSingle();
          if (profileError) return errorResponse("No se pudo validar la cuenta");
          if (!profile) return errorResponse("Usuario no encontrado", 404);
          if (profile.account_status !== "activo")
            return errorResponse("Reactiva la cuenta antes de cambiar la clave", 409);

          await recordAdminAuditEvent({
            actorId: ctx.userId,
            action: "identity.password_change_requested",
            resourceType: "profile",
            resourceId: params.id,
            reason: parsed.data.reason,
            request,
          });

          const password = randomBytes(24).toString("base64url");
          const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, { password });
          if (error) return errorResponse("No se pudo cambiar la clave", 500);

          let auditWarning = false;
          try {
            await recordAdminAuditEvent({
              actorId: ctx.userId,
              action: "identity.password_changed",
              resourceType: "profile",
              resourceId: params.id,
              reason: parsed.data.reason,
              request,
            });
          } catch {
            auditWarning = true;
          }

          const response = jsonResponse({
            temporary_password: password,
            audit_warning: auditWarning,
          });
          response.headers.set("Cache-Control", "no-store");
          return response;
        } catch {
          return errorResponse("No fue posible completar el cambio de clave");
        }
      },
    },
  },
});
