import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const createSchema = z.object({
  comercio_id: z.string().uuid(),
  producto_id: z.string().uuid().nullish(),
  contacto_nombre: z.string().trim().min(2).max(120),
  contacto_telefono: z.string().trim().min(7).max(30).nullish(),
  asunto: z.string().trim().min(3).max(200),
  origen: z.enum(["manual", "whatsapp", "telefono"]).default("manual"),
});

export const Route = createFileRoute("/api/store/leads")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const comercio = await getOwnedComercio(
          ctx,
          new URL(request.url).searchParams.get("comercio_id"),
          ["owner", "manager", "atencion"],
        );
        if (comercio instanceof Response) return comercio;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as SupabaseClient;
        const [{ data, error }, { data: store }, { data: memberships }] = await Promise.all([
          db
            .from("crm_leads")
            .select(
              "id, comercio_id, consulta_id, producto_id, origen, contacto_nombre, contacto_telefono, asunto, estado, responsable_id, proxima_accion_at, created_at, updated_at",
            )
            .eq("comercio_id", comercio.id)
            .order("created_at", { ascending: false })
            .limit(200),
          supabaseAdmin.from("comercios").select("owner_id").eq("id", comercio.id).single(),
          supabaseAdmin
            .from("comercio_miembros")
            .select("profile_id")
            .eq("comercio_id", comercio.id)
            .eq("activo", true)
            .in("rol", ["owner", "manager", "atencion"]),
        ]);
        if (error) return errorResponse("No se pudieron cargar las oportunidades", 500);
        const ids = [
          ...new Set([store?.owner_id, ...(memberships ?? []).map((m) => m.profile_id)]),
        ].filter((id): id is string => Boolean(id));
        const { data: profiles } = ids.length
          ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
          : { data: [] };
        return jsonResponse({ leads: data ?? [], equipo: profiles ?? [] });
      },
      POST: async ({ request }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const parsed = createSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return errorResponse("Datos de oportunidad inválidos", 400);
        const input = parsed.data;
        const comercio = await getOwnedComercio(ctx, input.comercio_id, [
          "owner",
          "manager",
          "atencion",
        ]);
        if (comercio instanceof Response) return comercio;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (input.producto_id) {
          const { data: product } = await supabaseAdmin
            .from("productos")
            .select("id")
            .eq("id", input.producto_id)
            .eq("comercio_id", comercio.id)
            .is("deleted_at", null)
            .maybeSingle();
          if (!product) return errorResponse("El producto no pertenece al comercio", 400);
        }
        const db = supabaseAdmin as unknown as SupabaseClient;
        const { data, error } = await db
          .from("crm_leads")
          .insert({
            ...input,
            comercio_id: comercio.id,
            producto_id: input.producto_id ?? null,
            contacto_telefono: input.contacto_telefono ?? null,
            responsable_id: ctx.userId,
            updated_by: ctx.userId,
          })
          .select("id")
          .single();
        if (error) return errorResponse("No se pudo crear la oportunidad", 500);
        return jsonResponse({ lead: data }, 201);
      },
    },
  },
});
