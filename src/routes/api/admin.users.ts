import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import { requireAdmin } from "@/lib/api-auth";

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      GET: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const url = new URL(request.url);
          const role = url.searchParams.get("role");
          const q = url.searchParams.get("q");

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          let query = supabaseAdmin
            .from("profiles")
            .select("id, full_name, phone, avatar_url, role, created_at")
            .order("created_at", { ascending: false });
          if (role) query = query.eq("role", role);
          if (q) query = query.ilike("full_name", `%${q}%`);
          const { data, error } = await query.limit(200);
          if (error) throw error;
          return jsonResponse({ usuarios: data || [] });
        } catch (e: any) {
          return errorResponse("Error al listar usuarios");
        }
      },
      PUT: async ({ request }) => {
        try {
          const ctx = await requireAdmin(request);
          if (ctx instanceof Response) return ctx;

          const body = await request.json().catch(() => ({}));
          const { id, role } = body || {};
          if (!id || !["cliente", "comercio", "admin", "super_admin"].includes(role)) {
            return errorResponse("id y role válido son requeridos", 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .update({ role })
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          return jsonResponse({ usuario: data });
        } catch (e: any) {
          return errorResponse("Error al actualizar usuario");
        }
      },
    },
  },
});
