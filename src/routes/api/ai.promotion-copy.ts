import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { callAI, parseJSON } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/ai/promotion-copy")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { producto, descuento, fecha_inicio, fecha_fin, tono, comercio_id } = await request
            .json()
            .catch(() => ({}));

          if (!producto) return errorResponse("producto requerido", 400);

          const comercio = await getOwnedComercio(ctx, comercio_id);
          if (comercio instanceof Response) return comercio;

          const raw = await callAI(
            [
              {
                role: "system",
                content:
                  "Eres copywriter de marketing local. Responde SOLO JSON: {titulo: string (max 60 chars), descripcion: string (max 180 chars), cta: string (max 25 chars), hashtags: string[] (max 5)}. En español, atractivo y directo.",
              },
              {
                role: "user",
                content: `Promo: ${producto}${descuento ? `, ${descuento}% off` : ""}${fecha_inicio && fecha_fin ? `, del ${fecha_inicio} al ${fecha_fin}` : ""}${tono ? `. Tono: ${tono}` : ""}.`,
              },
            ],
            { json: true },
          );

          const copy = parseJSON(raw);
          return jsonResponse({ copy });
        } catch (e: any) {
          return errorResponse("Error generando copy");
        }
      },
    },
  },
});
