import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const uuidSchema = z.string().uuid();
const querySchema = z.object({
  comercio_id: uuidSchema,
  producto_id: uuidSchema.nullish(),
  mensaje: z.string().trim().min(5).max(1200),
  canal: z.enum(["plataforma", "whatsapp", "telefono"]).optional(),
});

export const Route = createFileRoute("/api/client/queries")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          if (
            !(await enforceRateLimit(request, {
              scope: "client-queries",
              limit: 8,
              windowSeconds: 600,
            }))
          ) {
            return errorResponse("Demasiadas consultas. Intenta de nuevo más tarde.", 429);
          }
          const parsed = querySchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return errorResponse("Datos de consulta inválidos", 400);
          const { comercio_id, producto_id, mensaje, canal } = parsed.data;

          // Auth opcional: si trae bearer, se asocia al cliente
          let clienteId: string | null = null;
          const authHeader = request.headers.get("authorization");
          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const { createClient } = await import("@supabase/supabase-js");
            const sb = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_PUBLISHABLE_KEY!,
              { auth: { persistSession: false, autoRefreshToken: false } },
            );
            const { data } = await sb.auth.getUser(token);
            clienteId = data.user?.id || null;
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("consultas")
            .insert({
              cliente_id: clienteId,
              comercio_id,
              producto_id: producto_id || null,
              mensaje,
              canal: canal || "plataforma",
              estado: "nuevo",
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ consulta: data }, 201);
        } catch {
          return errorResponse("Error al enviar consulta");
        }
      },
    },
  },
});
