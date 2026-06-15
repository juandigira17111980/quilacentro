import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, errorResponse, optionsHandler } from "@/lib/cors";

type Categoria = {
  id: number;
  nombre: string;
  slug: string;
  icono_url: string | null;
  color: string | null;
  padre_id: number | null;
  activa: boolean;
  orden: number;
  hijos?: Categoria[];
};

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async () => {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data, error } = await supabaseAdmin
            .from("categorias")
            .select("id, nombre, slug, icono_url, color, padre_id, activa, orden")
            .eq("activa", true)
            .order("orden", { ascending: true })
            .order("nombre", { ascending: true });

          if (error) throw error;

          const items = (data || []) as Categoria[];
          const map = new Map<number, Categoria>();
          items.forEach((c) => map.set(c.id, { ...c, hijos: [] }));

          const tree: Categoria[] = [];
          map.forEach((c) => {
            if (c.padre_id && map.has(c.padre_id)) {
              map.get(c.padre_id)!.hijos!.push(c);
            } else {
              tree.push(c);
            }
          });

          return jsonResponse({ categorias: tree });
        } catch (e: any) {
          return errorResponse("Error al listar categorías");
        }
      },
    },
  },
});
