import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/products/$id")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      PUT: async ({ request, params }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: existing } = await supabaseAdmin
            .from("productos")
            .select("id, comercio_id")
            .eq("id", params.id)
            .maybeSingle();
          if (!existing) return errorResponse("Producto no encontrado", 404);
          const comercio = await getOwnedComercio(ctx, existing.comercio_id, [
            "owner",
            "manager",
            "catalogo",
          ]);
          if (comercio instanceof Response) return comercio;

          const body = await request.json().catch(() => ({}));
          const allowed = [
            "categoria_id",
            "nombre",
            "slug",
            "descripcion",
            "precio_base",
            "precio_oferta",
            "marca",
            "sku",
            "imagen_url",
            "imagenes",
            "disponible",
            "stock",
            "destacado",
            "tags",
            "atributos",
          ];
          const updates: Record<string, unknown> = {};
          for (const k of allowed) if (k in body) updates[k] = body[k];

          const { data, error } = await supabaseAdmin
            .from("productos")
            .update(updates as never)
            .eq("id", params.id)
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ producto: data });
        } catch (e: any) {
          return errorResponse("Error al actualizar producto");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: existing } = await supabaseAdmin
            .from("productos")
            .select("id, comercio_id")
            .eq("id", params.id)
            .maybeSingle();
          if (!existing) return errorResponse("Producto no encontrado", 404);
          const comercio = await getOwnedComercio(ctx, existing.comercio_id, [
            "owner",
            "manager",
            "catalogo",
          ]);
          if (comercio instanceof Response) return comercio;

          const { error } = await supabaseAdmin
            .from("productos")
            .update({ deleted_at: new Date().toISOString(), disponible: false })
            .eq("id", params.id);
          if (error) throw error;
          return jsonResponse({ ok: true });
        } catch (e: any) {
          return errorResponse("Error al eliminar producto");
        }
      },
    },
  },
});
