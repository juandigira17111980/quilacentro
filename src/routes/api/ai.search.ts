import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { callAI, parseJSON } from "@/lib/ai-gateway";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const searchSchema = z.object({
  query: z.string().trim().min(2).max(120),
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
});

type Intent = {
  keywords: string;
  categoria_hint: string | null;
  precio_min: number | null;
  precio_max: number | null;
  tipo: "producto" | "comercio" | "ambos";
};

function defaultIntent(query: string): Intent {
  return {
    keywords: query,
    categoria_hint: null,
    precio_min: null,
    precio_max: null,
    tipo: "ambos",
  };
}

export const Route = createFileRoute("/api/ai/search")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        const parsed = searchSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return errorResponse("Escribe una búsqueda de 2 a 120 caracteres", 400);

        try {
          if (
            !(await enforceRateLimit(request, {
              scope: "public-assistant",
              limit: 20,
              windowSeconds: 3600,
            }))
          ) {
            return errorResponse("Alcanzaste el límite de búsquedas por hora", 429);
          }

          const { query, lat, lng } = parsed.data;
          const aiReady = Boolean(process.env.AI_API_BASE_URL && process.env.AI_API_KEY);
          let intent = defaultIntent(query);
          if (aiReady) {
            try {
              const raw = await callAI(
                [
                  {
                    role: "system",
                    content:
                      "Extrae la intención de búsqueda local. Responde SOLO JSON con: {keywords: string, categoria_hint: string|null, precio_min: number|null, precio_max: number|null, tipo: 'producto'|'comercio'|'ambos'}",
                  },
                  { role: "user", content: query },
                ],
                { json: true },
              );
              const candidate = parseJSON<Partial<Intent>>(raw);
              if (
                candidate &&
                typeof candidate.keywords === "string" &&
                candidate.keywords.trim()
              ) {
                intent = { ...intent, keywords: candidate.keywords.trim().slice(0, 120) };
              }
              if (candidate?.tipo && ["producto", "comercio", "ambos"].includes(candidate.tipo)) {
                intent.tipo = candidate.tipo;
              }
            } catch {
              // Public catalog search remains available if the optional AI provider fails.
            }
          }

          const { supabasePublic } = await import("@/integrations/supabase/public.server");
          const keywords = intent.keywords.replace(/[%_]/g, " ").trim() || query;
          const [prodRes, comRes] = await Promise.all([
            intent.tipo !== "comercio"
              ? supabasePublic
                  .from("productos")
                  .select(
                    "id, nombre, slug, precio_base, precio_oferta, imagen_url, comercio_id, comercios!inner(estado)",
                  )
                  .eq("disponible", true)
                  .is("deleted_at", null)
                  .eq("comercios.estado", "activo")
                  .ilike("nombre", `%${keywords}%`)
                  .limit(20)
              : Promise.resolve({ data: [], error: null }),
            intent.tipo !== "producto"
              ? supabasePublic
                  .from("comercios")
                  .select("id, nombre, slug, logo_url, rating_avg, zona_id")
                  .is("deleted_at", null)
                  .eq("estado", "activo")
                  .ilike("nombre", `%${keywords}%`)
                  .limit(20)
              : Promise.resolve({ data: [], error: null }),
          ]);
          if (prodRes.error || comRes.error)
            return errorResponse("No fue posible consultar el catálogo", 503);

          const products = prodRes.data ?? [];
          const stores = comRes.data ?? [];
          let message =
            products.length || stores.length
              ? `Encontré ${products.length} productos y ${stores.length} comercios relacionados con “${query}”.`
              : `No encontré coincidencias para “${query}”. Prueba con otro producto o comercio.`;
          if (aiReady) {
            try {
              message = await callAI([
                {
                  role: "system",
                  content:
                    "Resume los resultados del catálogo en dos frases breves en español. No inventes comercios ni disponibilidad.",
                },
                {
                  role: "user",
                  content: `Búsqueda: "${query}". Productos: ${products.length}. Comercios: ${stores.length}.`,
                },
              ]);
            } catch {
              // Keep the factual catalog response when the provider is unavailable.
            }
          }

          return jsonResponse({
            intent,
            mensaje: message,
            productos: products,
            comercios: stores,
            ubicacion: lat !== undefined && lng !== undefined ? { lat, lng } : null,
          });
        } catch {
          return errorResponse("No fue posible completar la búsqueda", 503);
        }
      },
    },
  },
});
