import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async () => {
        const checkedAt = new Date().toISOString();
        try {
          const { supabasePublic } = await import("@/integrations/supabase/public.server");
          const { error } = await supabasePublic.from("categorias").select("id").limit(1);
          if (error) throw error;

          // Public browsing can work with the publishable key, but the operational
          // flows require the server-only client. Do not report a false healthy state
          // when orders, audit events, and account administration cannot run.
          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return jsonResponse(
              {
                status: "degraded",
                checked_at: checkedAt,
                services: { database: "ok", operations: "unavailable" },
              },
              503,
            );
          }

          return jsonResponse({
            status: "ok",
            checked_at: checkedAt,
            services: { database: "ok", operations: "ok" },
          });
        } catch {
          return jsonResponse(
            { status: "degraded", checked_at: checkedAt, services: { database: "unavailable" } },
            503,
          );
        }
      },
    },
  },
});
