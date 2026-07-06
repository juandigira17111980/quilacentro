import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

export const Route = createFileRoute("/api/store/queries")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const estado = url.searchParams.get("estado");
          const comercioId = url.searchParams.get("comercio_id");

          const comercio = await getOwnedComercio(ctx, comercioId);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let query = supabaseAdmin
            .from("consultas")
            .select(
              "*, profiles(id, full_name, avatar_url), productos(id, nombre, slug, imagen_url)",
            )
            .eq("comercio_id", comercio.id)
            .order("created_at", { ascending: false });

          if (estado) query = query.eq("estado", estado);

          const { data, error } = await query.limit(200);
          if (error) throw error;
          return jsonResponse({ consultas: data || [] });
        } catch (e: any) {
          return errorResponse("Error al obtener consultas");
        }
      },
    },
  },
});
