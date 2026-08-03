import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";
import { recordAdminAuditEvent } from "@/lib/audit.server";

export const Route = createFileRoute("/api/admin/categories")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { id, nombre, slug, icono_url, color, padre_id, activa, orden } = body || {};
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (id) {
            const { data: existing, error: existingError } = await supabaseAdmin
              .from("categorias")
              .select("id, nombre, slug, icono_url, color, padre_id, activa, orden")
              .eq("id", id)
              .maybeSingle();
            if (existingError) throw existingError;
            if (!existing) return errorResponse("Categoria no encontrada", 404);

            const updates: Record<string, unknown> = {};
            for (const key of [
              "nombre",
              "slug",
              "icono_url",
              "color",
              "padre_id",
              "activa",
              "orden",
            ]) {
              if (key in body) updates[key] = body[key];
            }
            const { data, error } = await supabaseAdmin
              .from("categorias")
              .update(updates as never)
              .eq("id", id)
              .select()
              .single();
            if (error) throw error;

            await recordAdminAuditEvent({
              actorId: ctx.userId,
              action: "catalog.category_updated",
              resourceType: "categoria",
              resourceId: String(id),
              beforeData: existing,
              afterData: data,
              request,
            });
            return jsonResponse({ categoria: data });
          }

          if (!nombre || !slug) return errorResponse("nombre y slug son requeridos", 400);

          const { data, error } = await supabaseAdmin
            .from("categorias")
            .insert({
              nombre,
              slug,
              icono_url,
              color,
              padre_id: padre_id || null,
              activa: activa ?? true,
              orden: orden ?? 0,
            })
            .select()
            .single();
          if (error) throw error;

          await recordAdminAuditEvent({
            actorId: ctx.userId,
            action: "catalog.category_created",
            resourceType: "categoria",
            resourceId: String(data.id),
            afterData: data,
            request,
          });
          return jsonResponse({ categoria: data }, 201);
        } catch {
          return errorResponse("Error al guardar categoria");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const id = new URL(request.url).searchParams.get("id");
          if (!id) return errorResponse("id es requerido", 400);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: existing, error: existingError } = await supabaseAdmin
            .from("categorias")
            .select("id, nombre, slug, icono_url, color, padre_id, activa, orden")
            .eq("id", Number(id))
            .maybeSingle();
          if (existingError) throw existingError;
          if (!existing) return errorResponse("Categoria no encontrada", 404);

          const { data, error } = await supabaseAdmin
            .from("categorias")
            .update({ activa: false })
            .eq("id", Number(id))
            .select()
            .single();
          if (error) throw error;

          await recordAdminAuditEvent({
            actorId: ctx.userId,
            action: "catalog.category_deactivated",
            resourceType: "categoria",
            resourceId: id,
            beforeData: existing,
            afterData: data,
            request,
          });
          return jsonResponse({ ok: true });
        } catch {
          return errorResponse("Error al eliminar categoria");
        }
      },
    },
  },
});
