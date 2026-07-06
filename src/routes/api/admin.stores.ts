import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

export const Route = createFileRoute("/api/admin/stores")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const estado = url.searchParams.get("estado");
          const q = url.searchParams.get("q");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let query = supabaseAdmin
            .from("comercios")
            .select(
              "*, profiles!comercios_owner_id_fkey(id, full_name, phone), zonas(id, nombre, ciudad), categorias(id, nombre)",
            )
            .order("created_at", { ascending: false });
          if (estado) query = query.eq("estado", estado);
          if (q) query = query.ilike("nombre", `%${q}%`);
          const { data, error } = await query.limit(200);
          if (error) throw error;
          return jsonResponse({ comercios: data || [] });
        } catch (e: any) {
          return errorResponse("Error al listar comercios");
        }
      },
    },
  },
});
