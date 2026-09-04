import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const cancelSchema = z.object({ motivo: z.string().trim().min(3).max(500) });

export const Route = createFileRoute("/api/client/orders/$id/cancel")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PATCH: async ({ request, params }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Indica el motivo de cancelación", 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("actualizar_estado_pedido", {
          p_actor_id: ctx.userId,
          p_pedido_id: params.id,
          p_estado: "cancelado",
          p_motivo: parsed.data.motivo,
        });
        if (error) return errorResponse("No fue posible cancelar el pedido", 400);
        return jsonResponse({ pedido: data });
      },
    },
  },
});
