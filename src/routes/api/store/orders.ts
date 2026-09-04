import { createFileRoute } from "@tanstack/react-router";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

export const Route = createFileRoute("/api/store/orders")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        const comercio = await getOwnedComercio(
          ctx,
          new URL(request.url).searchParams.get("comercio_id"),
          ["owner", "manager", "atencion"],
        );
        if (comercio instanceof Response) return comercio;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("pedidos")
          .select("*, items:pedido_items(*), cliente:profiles(id, full_name, phone)")
          .eq("comercio_id", comercio.id)
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) return errorResponse("No se pudieron consultar los pedidos");
        return jsonResponse({ pedidos: data ?? [] });
      },
    },
  },
});
