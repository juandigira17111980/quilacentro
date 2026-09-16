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
          return jsonResponse({
            status: "ok",
            checked_at: checkedAt,
            services: { database: "ok" },
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
