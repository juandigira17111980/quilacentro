import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import type { Json } from "@/integrations/supabase/types";

const orderSchema = z
  .object({
    comercio_id: z.string().uuid(),
    modalidad: z.enum(["recoger", "domicilio"]),
    contacto_nombre: z.string().trim().min(3).max(120),
    contacto_telefono: z.string().trim().min(7).max(30),
    direccion_entrega: z.record(z.string(), z.string().max(240)).optional().nullable(),
    notas_cliente: z.string().trim().max(700).optional().nullable(),
    items: z
      .array(
        z.object({ producto_id: z.string().uuid(), cantidad: z.number().int().min(1).max(99) }),
      )
      .min(1)
      .max(25),
  })
  .superRefine((value, ctx) => {
    if (value.modalidad === "domicilio" && !value.direccion_entrega?.direccion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["direccion_entrega"],
        message: "La dirección es obligatoria",
      });
    }
  });

export const Route = createFileRoute("/api/client/orders")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("pedidos")
          .select("*, comercio:comercios(id, nombre, slug, logo_url), items:pedido_items(*)")
          .eq("cliente_id", ctx.userId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return errorResponse("No se pudieron consultar los pedidos");
        return jsonResponse({ pedidos: data ?? [] });
      },
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;
          if (ctx.role !== "cliente")
            return errorResponse("Usa una cuenta de cliente para crear pedidos", 403);
          if (
            !(await enforceRateLimit(request, {
              scope: `orders:${ctx.userId}`,
              limit: 10,
              windowSeconds: 3600,
            }))
          ) {
            return errorResponse("Alcanzaste el límite de solicitudes por hora", 429);
          }
          const parsed = orderSchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return errorResponse("Datos de pedido inválidos", 400);
          const input = parsed.data;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: pedidoId, error } = await supabaseAdmin.rpc("create_pedido", {
            p_cliente_id: ctx.userId,
            p_comercio_id: input.comercio_id,
            p_modalidad: input.modalidad,
            p_contacto_nombre: input.contacto_nombre,
            p_contacto_telefono: input.contacto_telefono,
            p_direccion_entrega: (input.direccion_entrega ?? null) as Json | null,
            p_notas_cliente: input.notas_cliente ?? null,
            p_items: input.items as unknown as Json,
          });
          if (error || !pedidoId) return errorResponse("No fue posible crear el pedido", 400);
          return jsonResponse({ pedido_id: pedidoId }, 201);
        } catch {
          return errorResponse("No fue posible crear el pedido", 500);
        }
      },
    },
  },
});
