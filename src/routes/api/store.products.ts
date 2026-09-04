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

          const comercio = await getOwnedComercio(ctx, comercio_id, [
            "owner",
            "manager",
            "catalogo",
          ]);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const [{ data: subscription }, { data: commerce }, { count: productsCount }] =
            await Promise.all([
              supabaseAdmin
                .from("comercio_suscripciones")
                .select("plan_id")
                .eq("comercio_id", comercio.id)
                .in("estado", ["trial", "activa"])
                .order("inicia_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabaseAdmin.from("comercios").select("plan_id").eq("id", comercio.id).single(),
              supabaseAdmin
                .from("productos")
                .select("id", { count: "exact", head: true })
                .eq("comercio_id", comercio.id)
                .is("deleted_at", null),
            ]);
          const planId = subscription?.plan_id ?? commerce?.plan_id;
          if (!planId) return errorResponse("El comercio no tiene un plan operativo asignado", 409);
          const { data: plan } = await supabaseAdmin
            .from("planes_suscripcion")
            .select("max_productos, activo")
            .eq("id", planId)
            .maybeSingle();
          if (!plan?.activo) return errorResponse("El plan del comercio no está disponible", 409);
          if ((productsCount ?? 0) >= plan.max_productos) {
            return errorResponse(
              `Alcanzaste el límite de ${plan.max_productos} productos de tu plan`,
              409,
            );
          }
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
