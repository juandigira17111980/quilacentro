import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/products")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const {
            comercio_id,
            categoria_id,
            nombre,
            slug,
            descripcion,
            precio_base,
            precio_oferta,
            marca,
            sku,
            imagen_url,
            imagenes,
            disponible,
            stock,
            destacado,
            tags,
            atributos,
          } = body || {};

          if (!nombre || !slug || precio_base == null) {
            return errorResponse("nombre, slug y precio_base son requeridos", 400);
          }

          const comercio = await getOwnedComercio(ctx, comercio_id);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("productos")
            .insert({
              comercio_id: comercio.id,
              created_by: ctx.userId,
              categoria_id,
              nombre,
              slug,
              descripcion,
              precio_base,
              precio_oferta,
              marca,
              sku,
              imagen_url,
              imagenes: imagenes ?? [],
              disponible: disponible ?? true,
              stock,
              destacado: destacado ?? false,
              tags,
              atributos: atributos ?? {},
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ producto: data }, 201);
        } catch (e: any) {
          return errorResponse("Error al crear producto");
        }
      },
    },
  },
});
