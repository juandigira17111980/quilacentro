import { createHash } from "node:crypto";

type RateLimitConfig = {
  scope: string;
  limit: number;
  windowSeconds: number;
};

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Persists a fixed-window counter server-side. The database receives only a
 * SHA-256 digest, never the visitor's raw IP address.
 */
export async function enforceRateLimit(request: Request, config: RateLimitConfig) {
  const identifier = `${config.scope}:${clientIdentifier(request)}`;
  const keyHash = createHash("sha256").update(identifier).digest("hex");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds,
  });

  if (error) throw error;
  return data === true;
}
