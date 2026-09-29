import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const schema = z.object({
  ambiente: z.enum(["test", "prod"]),
  publicKey: z.string().trim().min(12).max(200),
  privateKey: z.string().trim().min(12).max(200),
  eventsSecret: z.string().trim().min(12).max(200),
  integritySecret: z.string().trim().min(12).max(200),
});

export const Route = createFileRoute("/api/admin/wompi-config")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await requireSuperAdmin(request);
        if (ctx instanceof Response) return ctx;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as SupabaseClient;
        const { data, error } = await db
          .from("wompi_config")
          .select("ambiente, updated_at")
          .order("ambiente");
        if (error) return errorResponse("No se pudo consultar Wompi", 500);
        const { hasWompiEncryptionKey } = await import("@/lib/wompi-config.server");
        return jsonResponse({
          ambientes: data ?? [],
          servidor_listo: hasWompiEncryptionKey(),
          pagos_activos: false,
        });
      },
      PUT: async ({ request }) => {
        const ctx = await requireSuperAdmin(request);
        if (ctx instanceof Response) return ctx;
        const { hasWompiEncryptionKey } = await import("@/lib/wompi-config.server");
        if (!hasWompiEncryptionKey()) {
          return errorResponse("Falta configurar PAYMENT_CONFIG_KEY en el servidor", 503);
        }
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Llaves inválidas", 400);
        const input = parsed.data;
        const suffix = input.ambiente === "test" ? "test" : "prod";
        if (
          !input.publicKey.startsWith(`pub_${suffix}_`) ||
          !input.privateKey.startsWith(`prv_${suffix}_`) ||
          !input.eventsSecret.startsWith(`${suffix}_events_`) ||
          !input.integritySecret.startsWith(`${suffix}_integrity_`)
        ) {
          return errorResponse("Las llaves no corresponden al ambiente elegido", 400);
        }
        try {
          const { encryptWompiCredentials } = await import("@/lib/wompi-config.server");
          const encrypted = encryptWompiCredentials(input);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const db = supabaseAdmin as unknown as SupabaseClient;
          const { error } = await db.from("wompi_config").upsert({
            ambiente: input.ambiente,
            credentials_encrypted: encrypted,
            updated_by: ctx.userId,
            updated_at: new Date().toISOString(),
          });
          if (error) return errorResponse("No se pudo guardar la configuración", 500);
          await supabaseAdmin.from("audit_events").insert({
            actor_id: ctx.userId,
            action: "payment.credentials.updated",
            resource_type: "wompi_config",
            resource_id: input.ambiente,
            reason: "Configuración de credenciales",
          });
          return jsonResponse({ ok: true, pagos_activos: false });
        } catch {
          return errorResponse("No se pudo guardar la configuración", 500);
        }
      },
    },
  },
});
