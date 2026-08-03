import { randomUUID } from "node:crypto";

type AuditEventInput = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason?: string | null;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  request: Request;
};

export function requestAuditContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || null;

  return {
    requestId: randomUUID(),
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function recordAdminAuditEvent(input: AuditEventInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const context = requestAuditContext(input.request);
  const { error } = await supabaseAdmin.rpc("record_admin_audit_event", {
    p_actor_id: input.actorId,
    p_action: input.action,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId,
    p_reason: input.reason ?? null,
    p_before_data: input.beforeData ?? {},
    p_after_data: input.afterData ?? {},
    p_request_id: context.requestId,
    p_ip_address: context.ipAddress,
    p_user_agent: context.userAgent,
  });
  if (error) throw error;
  return context;
}
