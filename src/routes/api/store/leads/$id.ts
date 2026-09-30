import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const updateSchema = z
  .object({
    estado: z.enum(["nuevo", "contactado", "cotizado", "ganado", "perdido"]).optional(),
    responsable_id: z.string().uuid().nullable().optional(),
    proxima_accion_at: z.string().datetime({ offset: true }).nullable().optional(),
    nota: z.string().trim().min(2).max(1000).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0 && (!value.nota || Object.keys(value).length === 1),
  );

export const Route = createFileRoute("/api/store/leads/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request, params }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        if (!z.string().uuid().safeParse(params.id).success)
          return errorResponse("ID inválido", 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as SupabaseClient;
        const { data: lead } = await db
          .from("crm_leads")
          .select("*, consulta:consultas(mensaje, canal)")
          .eq("id", params.id)
          .maybeSingle();
        if (!lead) return errorResponse("Oportunidad no encontrada", 404);
        const comercio = await getOwnedComercio(ctx, lead.comercio_id, [
          "owner",
          "manager",
          "atencion",
        ]);
        if (comercio instanceof Response) return comercio;
        const { data: activities, error } = await db
          .from("crm_actividades")
          .select("id, tipo, detalle, actor_id, created_at")
          .eq("lead_id", params.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return errorResponse("No se pudo cargar el seguimiento", 500);
        return jsonResponse({ lead, actividades: activities ?? [] });
      },
      PATCH: async ({ request, params }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        if (!z.string().uuid().safeParse(params.id).success)
          return errorResponse("ID inválido", 400);
        const parsed = updateSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Datos inválidos", 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as SupabaseClient;
        const { data: previous } = await db
          .from("crm_leads")
          .select("comercio_id, estado, responsable_id")
          .eq("id", params.id)
          .maybeSingle();
        if (!previous) return errorResponse("Oportunidad no encontrada", 404);
        const comercio = await getOwnedComercio(ctx, previous.comercio_id, [
          "owner",
          "manager",
          "atencion",
        ]);
        if (comercio instanceof Response) return comercio;

        const input = parsed.data;
        if (input.nota) {
          const { error: noteError } = await db.from("crm_actividades").insert({
            lead_id: params.id,
            actor_id: ctx.userId,
            tipo: "nota",
            detalle: input.nota,
          });
          if (noteError) return errorResponse("No se pudo guardar la nota", 500);
          return jsonResponse({ ok: true });
        }
        if (input.responsable_id) {
          const { data: owner } = await supabaseAdmin
            .from("comercios")
            .select("id")
            .eq("id", comercio.id)
            .eq("owner_id", input.responsable_id)
            .maybeSingle();
          if (!owner) {
            const { data: member } = await supabaseAdmin
              .from("comercio_miembros")
              .select("id")
              .eq("comercio_id", comercio.id)
              .eq("profile_id", input.responsable_id)
              .eq("activo", true)
              .in("rol", ["owner", "manager", "atencion"])
              .maybeSingle();
            if (!member) return errorResponse("Responsable ajeno al comercio", 400);
          }
        }
        const changes = {
          ...(input.estado !== undefined && { estado: input.estado }),
          ...(input.responsable_id !== undefined && { responsable_id: input.responsable_id }),
          ...(input.proxima_accion_at !== undefined && {
            proxima_accion_at: input.proxima_accion_at,
          }),
          updated_at: new Date().toISOString(),
          updated_by: ctx.userId,
        };
        const { data, error } = await db
          .from("crm_leads")
          .update(changes)
          .eq("id", params.id)
          .eq("comercio_id", comercio.id)
          .select("*")
          .single();
        if (error) return errorResponse("No se pudo actualizar la oportunidad", 500);
        return jsonResponse({ lead: data });
      },
    },
  },
});
