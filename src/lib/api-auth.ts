import { createClient } from "@supabase/supabase-js";
import { jsonResponse, errorResponse } from "./cors";

export type AuthedContext = {
  userId: string;
  role: AppRole;
  accountStatus: AccountStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
};

export const APP_ROLES = ["cliente", "comercio", "admin", "super_admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ACCOUNT_STATUSES = ["activo", "suspendido"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

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

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) return errorResponse("No se pudo validar la cuenta");
  if (!profile) return errorResponse("Cuenta incompleta", 403);

  const role = profile.role as AppRole;
  const accountStatus = profile.account_status as AccountStatus;
  if (!APP_ROLES.includes(role)) return errorResponse("Rol de cuenta invalido", 403);
  if (accountStatus !== "activo") return errorResponse("Cuenta suspendida", 403);

  return { userId: data.user.id, role, accountStatus, supabase };
}

/**
 * Obtiene el comercio del usuario actual. Si se pasa comercio_id, valida ownership.
 */
export async function getOwnedComercio(
  ctx: AuthedContext,
  comercioId?: string | null,
): Promise<{ id: string } | Response> {
  if (ctx.role !== "comercio") {
    return errorResponse("Acceso exclusivo para comercios", 403);
  }
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
  if (ctx.role !== "admin" && ctx.role !== "super_admin") {
    return errorResponse("Acceso solo para administradores", 403);
  }
  return ctx;
}

/** Verifica que la accion sea de gobierno de plataforma. */
export async function requireSuperAdmin(request: Request): Promise<AuthedContext | Response> {
  const ctx = await authenticate(request);
  if (ctx instanceof Response) return ctx;
  if (ctx.role !== "super_admin") {
    return errorResponse("Acceso exclusivo para super administradores", 403);
  }
  return ctx;
}

export { jsonResponse, errorResponse };
