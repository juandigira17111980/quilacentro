import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/profile")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const {
            id,
            nombre,
            slug,
            descripcion,
            logo_url,
            banner_url,
            categoria_id,
            zona_id,
            direccion,
            lat,
            lng,
            telefono,
            whatsapp,
            email,
            horarios,
          } = body || {};

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          if (id) {
            // Update: validar ownership
            const { data: existing } = await supabaseAdmin
              .from("comercios")
              .select("id, owner_id")
              .eq("id", id)
              .maybeSingle();
            if (!existing || existing.owner_id !== ctx.userId) {
              return errorResponse("No autorizado", 403);
            }
            const { data, error } = await supabaseAdmin
              .from("comercios")
              .update({
                nombre,
                slug,
                descripcion,
                logo_url,
                banner_url,
                categoria_id,
                zona_id,
                direccion,
                lat,
                lng,
                telefono,
                whatsapp,
                email,
                horarios,
              })
              .eq("id", id)
              .select()
              .single();
            if (error) throw error;
            return jsonResponse({ comercio: data });
          }

          if (!nombre || !slug) {
            return errorResponse("nombre y slug son requeridos", 400);
          }

          const { data, error } = await supabaseAdmin
            .from("comercios")
            .insert({
              owner_id: ctx.userId,
              created_by: ctx.userId,
              nombre,
              slug,
              descripcion,
              logo_url,
              banner_url,
              categoria_id,
              zona_id,
              direccion,
              lat,
              lng,
              telefono,
              whatsapp,
              email,
              horarios,
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ comercio: data }, 201);
        } catch (e: any) {
          return errorResponse("Error al guardar perfil");
        }
      },
    },
  },
});
