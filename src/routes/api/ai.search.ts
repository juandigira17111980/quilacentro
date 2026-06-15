import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate } from "@/lib/api-auth";
import { callAI, parseJSON } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/ai/search")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { query, lat, lng } = await request.json().catch(() => ({}));
          if (!query || typeof query !== "string") {
            return errorResponse("query requerido", 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // 1. Extraer intención con IA
          const intentRaw = await callAI(
            [
              {
                role: "system",
                content:
                  "Eres un asistente que extrae intención de búsqueda local. Responde SOLO JSON con: {keywords: string, categoria_hint: string|null, precio_min: number|null, precio_max: number|null, tipo: 'producto'|'comercio'|'ambos'}",
              },
              { role: "user", content: query },
            ],
            { json: true },
          );
          const intent = parseJSON<{
            keywords: string;
            categoria_hint: string | null;
            precio_min: number | null;
            precio_max: number | null;
            tipo: "producto" | "comercio" | "ambos";
          }>(intentRaw);

          // 2. Buscar en BD
          const keywords = (intent.keywords || query).trim();
          const tipo = intent.tipo || "ambos";

          const [prodRes, comRes] = await Promise.all([
            tipo !== "comercio"
              ? supabaseAdmin
                  .from("productos")
                  .select("id, nombre, slug, precio_base, precio_oferta, imagen_url, comercio_id")
                  .is("deleted_at", null)
                  .eq("disponible", true)
                  .ilike("nombre", `%${keywords}%`)
                  .limit(20)
              : Promise.resolve({ data: [], error: null }),
            tipo !== "producto"
              ? supabaseAdmin
                  .from("comercios")
                  .select("id, nombre, slug, logo_url, rating_avg, zona_id")
                  .is("deleted_at", null)
                  .eq("estado", "activo")
                  .ilike("nombre", `%${keywords}%`)
                  .limit(20)
              : Promise.resolve({ data: [], error: null }),
          ]);

          // 3. Respuesta conversacional
          const summary = await callAI([
            {
              role: "system",
              content:
                "Eres un asistente local amigable. Resume en 2 frases breves los resultados encontrados para el usuario, en español.",
            },
            {
              role: "user",
              content: `Búsqueda: "${query}". Productos: ${prodRes.data?.length ?? 0}. Comercios: ${comRes.data?.length ?? 0}.`,
            },
          ]);

          return jsonResponse({
            intent,
            mensaje: summary,
            productos: prodRes.data ?? [],
            comercios: comRes.data ?? [],
            ubicacion: lat && lng ? { lat, lng } : null,
          });
        } catch (e: any) {
          return errorResponse("Error en búsqueda IA");
        }
      },
    },
  },
});
