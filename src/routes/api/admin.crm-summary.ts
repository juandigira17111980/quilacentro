import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/admin/crm-summary")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await requireAdmin(request);
        if (ctx instanceof Response) return ctx;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as SupabaseClient;
        const { data, error } = await db.rpc("crm_resumen_admin");
        if (error) return errorResponse("No se pudo consultar el resumen comercial", 500);
        return jsonResponse({ comercios: data ?? [] });
      },
    },
  },
});
