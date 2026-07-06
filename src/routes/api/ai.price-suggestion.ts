import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { callAI, parseJSON } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/ai/price-suggestion")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { nombre, categoria_id, marca, comercio_id } = await request
            .json()
            .catch(() => ({}));
          if (!nombre) return errorResponse("nombre requerido", 400);

          const comercio = await getOwnedComercio(ctx, comercio_id);
          if (comercio instanceof Response) return comercio;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Buscar productos similares en mercado
          let q = supabaseAdmin
            .from("productos")
            .select("nombre, precio_base, precio_oferta, marca")
            .is("deleted_at", null)
            .eq("disponible", true)
            .ilike("nombre", `%${nombre}%`)
            .limit(30);
          if (categoria_id) q = q.eq("categoria_id", categoria_id);

          const { data: similares } = await q;

          const precios = (similares ?? [])
            .map((p: any) => Number(p.precio_oferta ?? p.precio_base))
            .filter((n) => Number.isFinite(n) && n > 0);

          const stats = precios.length
            ? {
                n: precios.length,
                min: Math.min(...precios),
                max: Math.max(...precios),
                avg: precios.reduce((a, b) => a + b, 0) / precios.length,
              }
            : null;

          const raw = await callAI(
            [
              {
                role: "system",
                content:
                  "Eres analista de pricing local. Responde SOLO JSON: {precio_sugerido: number, precio_min: number, precio_max: number, justificacion: string}.",
              },
              {
                role: "user",
                content: `Producto: ${nombre}${marca ? ` ${marca}` : ""}. Datos de mercado (${stats?.n ?? 0} similares): ${stats ? `min ${stats.min}, max ${stats.max}, promedio ${stats.avg.toFixed(2)}` : "sin datos"}. Sugiere precio competitivo.`,
              },
            ],
            { json: true },
          );

          const sugerencia = parseJSON(raw);
          return jsonResponse({ sugerencia, mercado: stats, muestras: similares?.length ?? 0 });
        } catch (e: any) {
          return errorResponse("Error sugiriendo precio");
        }
      },
    },
  },
});
