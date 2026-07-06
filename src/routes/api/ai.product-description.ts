import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { authenticate, getOwnedComercio } from "@/lib/api-auth";
import { callAI } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/ai/product-description")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const ctx = await authenticate(request);
          if (ctx instanceof Response) return ctx;

          const { nombre, marca, categoria, atributos, tono, comercio_id } = await request
            .json()
            .catch(() => ({}));

          if (!nombre) return errorResponse("nombre requerido", 400);

          const comercio = await getOwnedComercio(ctx, comercio_id);
          if (comercio instanceof Response) return comercio;

          const descripcion = await callAI([
            {
              role: "system",
              content:
                "Eres copywriter de e-commerce local. Genera descripciones de producto atractivas, en español, 2-3 párrafos cortos, destacando beneficios. Sin emojis a menos que se pida.",
            },
            {
              role: "user",
              content: `Producto: ${nombre}${marca ? ` (marca: ${marca})` : ""}${categoria ? `, categoría: ${categoria}` : ""}${atributos ? `, atributos: ${JSON.stringify(atributos)}` : ""}${tono ? `. Tono: ${tono}` : ""}.`,
            },
          ]);

          return jsonResponse({ descripcion });
        } catch (e: any) {
          return errorResponse("Error generando descripción");
        }
      },
    },
  },
});
