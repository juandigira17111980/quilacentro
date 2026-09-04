import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/admin/audit-events")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? "30");
          const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 100)
            : 30;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("audit_events")
            .select("id, actor_id, action, resource_type, resource_id, reason, created_at")
            .order("created_at", { ascending: false })
            .limit(limit);
          if (error) throw error;
          return jsonResponse({ eventos: data ?? [] });
        } catch {
          return errorResponse("No se pudo consultar la bitácora", 500);
        }
      },
    },
  },
});
