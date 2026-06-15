import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";

export const Route = createFileRoute("/api/client/queries")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const { comercio_id, producto_id, mensaje, canal } = body || {};
          if (!comercio_id || !mensaje) {
            return errorResponse("comercio_id y mensaje son requeridos", 400);
          }

          // Auth opcional: si trae bearer, se asocia al cliente
          let clienteId: string | null = null;
          const authHeader = request.headers.get("authorization");
          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const { createClient } = await import("@supabase/supabase-js");
            const sb = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_PUBLISHABLE_KEY!,
              { auth: { persistSession: false, autoRefreshToken: false } },
            );
            const { data } = await sb.auth.getUser(token);
            clienteId = data.user?.id || null;
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("consultas")
            .insert({
              cliente_id: clienteId,
              comercio_id,
              producto_id: producto_id || null,
              mensaje,
              canal: canal || "plataforma",
              estado: "nuevo",
            })
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ consulta: data }, 201);
        } catch (e: any) {
          return errorResponse("Error al enviar consulta");
        }
      },
    },
  },
});
