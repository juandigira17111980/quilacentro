import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

export const Route = createFileRoute("/api/admin/categories")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { id, nombre, slug, icono_url, color, padre_id, activa, orden } =
            body || {};

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          if (id) {
            const updates: Record<string, unknown> = {};
            for (const k of ["nombre", "slug", "icono_url", "color", "padre_id", "activa", "orden"]) {
              if (k in body) updates[k] = body[k];
            }
            const { data, error } = await supabaseAdmin
              .from("categorias")
              .update(updates as never)
              .eq("id", id)
              .select()
              .single();
            if (error) throw error;
            return jsonResponse({ categoria: data });
          }

          if (!nombre || !slug) {
            return errorResponse("nombre y slug son requeridos", 400);
          }

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
          return jsonResponse({ categoria: data }, 201);
        } catch (e: any) {
          return errorResponse("Error al guardar categoría");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) return errorResponse("id es requerido", 400);

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          // Soft delete: desactivar
          const { error } = await supabaseAdmin
            .from("categorias")
            .update({ activa: false })
            .eq("id", Number(id));
          if (error) throw error;
          return jsonResponse({ ok: true });
        } catch (e: any) {
          return errorResponse("Error al eliminar categoría");
        }
      },
    },
  },
});
