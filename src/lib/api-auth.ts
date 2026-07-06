import { createClient } from "@supabase/supabase-js";
import { jsonResponse, errorResponse } from "./cors";

export type AuthedContext = {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
};

/**
 * Valida el bearer token, devuelve cliente Supabase con contexto del usuario.
 * RLS aplica como ese usuario.
 */
export async function authenticate(request: Request): Promise<AuthedContext | Response> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("No autenticado", 401);
  }
  const token = authHeader.slice(7);

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return errorResponse("Token inválido", 401);

  return { userId: data.user.id, supabase };
}

/**
 * Obtiene el comercio del usuario actual. Si se pasa comercio_id, valida ownership.
 */
export async function getOwnedComercio(
  ctx: AuthedContext,
  comercioId?: string | null,
): Promise<{ id: string } | Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin
    .from("comercios")
    .select("id")
    .eq("owner_id", ctx.userId)
    .is("deleted_at", null);
  if (comercioId) query = query.eq("id", comercioId);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) return errorResponse(error.message);
  if (!data) return errorResponse("Comercio no encontrado", 404);
  return data as { id: string };
}

/**
 * Verifica que el usuario autenticado sea admin o super_admin.
 */
export async function requireAdmin(request: Request): Promise<AuthedContext | Response> {
  const ctx = await authenticate(request);
  if (ctx instanceof Response) return ctx;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (error) return errorResponse(error.message);
  const role = (data as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "super_admin") {
    return errorResponse("Acceso solo para administradores", 403);
  }
  return ctx;
}

export { jsonResponse, errorResponse };
