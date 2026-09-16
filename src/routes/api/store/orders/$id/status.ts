import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const statusSchema = z.object({
  estado: z.enum([
    "aceptado",
    "rechazado",
    "preparando",
    "listo",
    "en_camino",
    "entregado",
    "cancelado",
  ]),
  motivo: z.string().trim().max(500).optional().nullable(),
});

export const Route = createFileRoute("/api/store/orders/$id/status")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PATCH: async ({ request, params }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const parsed = statusSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Estado de pedido inválido", 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: pedido, error: readError } = await supabaseAdmin
          .from("pedidos")
          .select("comercio_id")
          .eq("id", params.id)
          .maybeSingle();
        if (readError || !pedido) return errorResponse("Pedido no encontrado", 404);
        const comercio = await getOwnedComercio(ctx, pedido.comercio_id, [
          "owner",
          "manager",
          "atencion",
        ]);
        if (comercio instanceof Response) return comercio;
        const { data, error } = await supabaseAdmin.rpc("actualizar_estado_pedido", {
          p_actor_id: ctx.userId,
          p_pedido_id: params.id,
          p_estado: parsed.data.estado,
          p_motivo: parsed.data.motivo ?? null,
        });
        if (error) return errorResponse("No fue posible actualizar el pedido", 400);
        return jsonResponse({ pedido: data });
      },
    },
  },
});
