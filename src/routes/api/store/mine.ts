import { createFileRoute } from "@tanstack/react-router";
import { authenticate } from "@/lib/api-auth";
import { errorResponse, jsonResponse, optionsHandler } from "@/lib/cors";

const storeColumns =
  "id, owner_id, nombre, slug, descripcion, logo_url, banner_url, categoria_id, direccion, lat, lng, telefono, whatsapp, email, horarios, estado, plan_id, rating_avg, total_reviews, tour_360_url, recogida_disponible, recogida_notas, domicilio_disponible, domicilio_notas, disponibilidad_notas, confianza_notas";

export const Route = createFileRoute("/api/store/mine")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if (ctx instanceof Response) return ctx;
        if (ctx.role !== "comercio") return errorResponse("Acceso exclusivo para comercios", 403);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [owned, memberships] = await Promise.all([
          supabaseAdmin
            .from("comercios")
            .select(storeColumns)
            .eq("owner_id", ctx.userId)
            .is("deleted_at", null),
          supabaseAdmin
            .from("comercio_miembros")
            .select("comercio_id")
            .eq("profile_id", ctx.userId)
            .eq("activo", true),
        ]);
        if (owned.error || memberships.error)
          return errorResponse("No se pudieron cargar tus comercios");

        const ownedIds = new Set((owned.data ?? []).map((store) => store.id));
        const memberIds = [
          ...new Set((memberships.data ?? []).map((member) => member.comercio_id)),
        ].filter((id) => !ownedIds.has(id));
        let memberStores: typeof owned.data = [];
        if (memberIds.length > 0) {
          const result = await supabaseAdmin
            .from("comercios")
            .select(storeColumns)
            .in("id", memberIds)
            .is("deleted_at", null);
          if (result.error) return errorResponse("No se pudieron cargar tus comercios");
          memberStores = result.data ?? [];
        }

        const comercios = [...(owned.data ?? []), ...(memberStores ?? [])].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es"),
        );
        const response = jsonResponse({ comercios });
        response.headers.set("Cache-Control", "no-store");
        return response;
      },
    },
  },
});
