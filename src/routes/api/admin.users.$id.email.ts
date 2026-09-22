import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api-auth";
import { recordAdminAuditEvent } from "@/lib/audit.server";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const schema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  reason: z.string().trim().min(10).max(500),
});

export const Route = createFileRoute("/api/admin/users/$id/email")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        const ctx = await requireSuperAdmin(request);
        if (ctx instanceof Response) return ctx;
        if (!z.string().uuid().safeParse(params.id).success)
          return errorResponse("Usuario inválido", 400);
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Correo o motivo inválido", 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(params.id);
        if (error || !data.user) return errorResponse("Usuario no encontrado", 404);
        if (data.user.email?.toLowerCase() === parsed.data.email)
          return errorResponse("El correo ya es el actual", 409);

        await recordAdminAuditEvent({
          actorId: ctx.userId,
          action: "identity.email_change_requested",
          resourceType: "profile",
          resourceId: params.id,
          reason: parsed.data.reason,
          request,
        });

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
          email: parsed.data.email,
          email_confirm: true,
        });
        if (updateError) return errorResponse("No se pudo cambiar el correo", 409);

        try {
          await recordAdminAuditEvent({
            actorId: ctx.userId,
            action: "identity.email_changed",
            resourceType: "profile",
            resourceId: params.id,
            reason: parsed.data.reason,
            request,
          });
        } catch {
          const response = jsonResponse({ email: parsed.data.email, audit_warning: true });
          response.headers.set("Cache-Control", "no-store");
          return response;
        }
        const response = jsonResponse({ email: parsed.data.email });
        response.headers.set("Cache-Control", "no-store");
        return response;
      },
    },
  },
});
