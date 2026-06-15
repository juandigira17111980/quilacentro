import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";

export const Route = createFileRoute("/api/client/reviews")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { comercio_id, producto_id, rating, comentario } = body || {};
          if (!comercio_id || !rating || rating < 1 || rating > 5) {
            return errorResponse("comercio_id y rating (1-5) son requeridos", 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // Upsert: una calificación por (cliente, comercio, producto)
          const { data, error } = await supabaseAdmin
            .from("calificaciones")
            .upsert(
              {
                cliente_id: ctx.userId,
                comercio_id,
                producto_id: producto_id || null,
                rating,
                comentario,
              },
              { onConflict: "cliente_id,comercio_id,producto_id" },
            )
            .select()
            .single();
          if (error) throw error;

          // Recalcular rating_avg del comercio
          const { data: stats } = await supabaseAdmin
            .from("calificaciones")
            .select("rating")
            .eq("comercio_id", comercio_id);
          const ratings = (stats || []).map((r: any) => r.rating);
          const avg =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          await supabaseAdmin
            .from("comercios")
            .update({
              rating_avg: Number(avg.toFixed(2)),
              total_reviews: ratings.length,
            })
            .eq("id", comercio_id);

          return jsonResponse({ calificacion: data }, 201);
        } catch (e: any) {
          return errorResponse(e?.message || "Error al crear calificación");
        }
      },
    },
  },
});
