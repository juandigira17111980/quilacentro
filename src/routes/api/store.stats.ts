import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";

type LeadEventRow = {
  producto_id: string | null;
  productos?: { nombre: string | null; slug: string | null } | null;
};

export const Route = createFileRoute("/api/store/stats")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const comercioId = url.searchParams.get("comercio_id");
          const comercio = await getOwnedComercio(ctx, comercioId);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const now = new Date().toISOString();
          const desde30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

          const [
            productosRes,
            promocionesRes,
            consultasNuevasRes,
            consultasTotalRes,
            calificacionesRes,
            favoritosRes,
            consultas30Res,
            vistasRes,
          ] = await Promise.all([
            supabaseAdmin
              .from("productos")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .is("deleted_at", null),
            supabaseAdmin
              .from("promociones")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .eq("activa", true)
              .lte("fecha_inicio", now)
              .gte("fecha_fin", now),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .eq("estado", "nuevo"),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id),
            supabaseAdmin.from("calificaciones").select("rating").eq("comercio_id", comercio.id),
            supabaseAdmin
              .from("favoritos")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id),
            supabaseAdmin
              .from("consultas")
              .select("id", { count: "exact", head: true })
              .eq("comercio_id", comercio.id)
              .gte("created_at", desde30),
            supabaseAdmin
              .from("productos")
              .select("vistas")
              .eq("comercio_id", comercio.id)
              .is("deleted_at", null),
          ]);

          const ratings = (calificacionesRes.data || []).map((r: any) => r.rating);
          const ratingAvg =
            ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          const totalVistas = (vistasRes.data || []).reduce((a, p: any) => a + (p.vistas || 0), 0);
          const [whatsappRes, directionsRes, availabilityRes, productInterestRes] =
            await Promise.all([
              supabaseAdmin
                .from("lead_events")
                .select("id", { count: "exact", head: true })
                .eq("comercio_id", comercio.id)
                .eq("event_type", "whatsapp_click")
                .gte("created_at", desde30),
              supabaseAdmin
                .from("lead_events")
                .select("id", { count: "exact", head: true })
                .eq("comercio_id", comercio.id)
                .eq("event_type", "directions_click")
                .gte("created_at", desde30),
              supabaseAdmin
                .from("lead_events")
                .select("id", { count: "exact", head: true })
                .eq("comercio_id", comercio.id)
                .eq("event_type", "availability_submit")
                .gte("created_at", desde30),
              supabaseAdmin
                .from("lead_events")
                .select("producto_id, productos(nombre, slug)")
                .eq("comercio_id", comercio.id)
                .not("producto_id", "is", null)
                .gte("created_at", desde30)
                .order("created_at", { ascending: false })
                .limit(500),
            ]);

          const productInterest = new Map<
            string,
            { producto_id: string; nombre: string; slug: string; eventos: number }
          >();

          for (const event of (productInterestRes.data || []) as LeadEventRow[]) {
            if (!event.producto_id) continue;
            const existing = productInterest.get(event.producto_id);
            if (existing) {
              existing.eventos += 1;
              continue;
            }
            productInterest.set(event.producto_id, {
              producto_id: event.producto_id,
              nombre: event.productos?.nombre || "Producto",
              slug: event.productos?.slug || "",
              eventos: 1,
            });
          }

          const whatsappClicks = whatsappRes.error ? 0 : (whatsappRes.count ?? 0);
          const directionsClicks = directionsRes.error ? 0 : (directionsRes.count ?? 0);
          const availabilitySubmits = availabilityRes.error ? 0 : (availabilityRes.count ?? 0);

          return jsonResponse({
            comercio_id: comercio.id,
            productos: productosRes.count ?? 0,
            promociones_activas: promocionesRes.count ?? 0,
            consultas_nuevas: consultasNuevasRes.count ?? 0,
            consultas_total: consultasTotalRes.count ?? 0,
            consultas_30d: consultas30Res.count ?? 0,
            favoritos: favoritosRes.count ?? 0,
            rating_promedio: Number(ratingAvg.toFixed(2)),
            total_reviews: ratings.length,
            vistas_totales: totalVistas,
            eventos_30d: {
              whatsapp_clicks: whatsappClicks,
              directions_clicks: directionsClicks,
              availability_submits: availabilitySubmits,
              total: whatsappClicks + directionsClicks + availabilitySubmits,
            },
            productos_interes: Array.from(productInterest.values())
              .sort((a, b) => b.eventos - a.eventos)
              .slice(0, 5),
          });
        } catch (e: any) {
          return errorResponse("Error al obtener estadísticas");
        }
      },
    },
  },
});
