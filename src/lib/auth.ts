import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "cliente" | "comercio" | "admin" | "super_admin";

/** Returns the current user's role, or null if not signed in. */
export async function getCurrentRole(): Promise<{ userId: string; role: AppRole } | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data } = await supabase.rpc("get_current_identity");
  const profile = data?.[0] as { role?: string; account_status?: string } | undefined;
  if (profile?.account_status !== "activo") return null;
  const role = (profile?.role ?? "cliente") as AppRole;
  return { userId: user.id, role };
}

/** Default landing route by role. */
export function landingForRole(role: AppRole): string {
  if (role === "comercio") return "/dashboard";
  if (role === "admin" || role === "super_admin") return "/admin";
  return "/";
}

/**
 * Guard for `beforeLoad`. Requires the user to be authenticated and to hold
 * one of the allowed roles. Redirects to /auth (or / with a toast hint) on failure.
 *
 * Throws `redirect()` so callers don't need to handle it.
 */
export async function requireRole(allowed: AppRole[], currentPath: string) {
  const session = await getCurrentRole();
  if (!session) {
    throw redirect({ to: "/auth", search: { redirect: currentPath } as never });
  }
  if (!allowed.includes(session.role)) {
    throw redirect({ to: "/", search: { denied: "1" } as never });
  }
  return session;
}
