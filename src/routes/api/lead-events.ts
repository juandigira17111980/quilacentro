import { createFileRoute } from "@tanstack/react-router";
import { optionsHandler, jsonResponse, errorResponse } from "@/lib/cors";
import type { Json } from "@/integrations/supabase/types";

const EVENT_TYPES = ["whatsapp_click", "directions_click", "availability_submit"] as const;
const CHANNELS = ["web", "whatsapp", "maps", "platform"] as const;
const SOURCES = ["product_detail", "store_detail", "map", "search", "unknown"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAllowed<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function pickIp(request: Request) {
  const raw = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  return raw?.split(",")[0]?.trim() || null;
}

function cleanMetadata(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Json;
}

export const Route = createFileRoute("/api/lead-events")({
  server: {
    handlers: {
      OPTIONS: optionsHandler,
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== "object") {
            return errorResponse("Body inválido", 400);
          }

          const payload = body as Record<string, unknown>;
          const eventType = String(payload.event_type ?? "");
          const comercioId = String(payload.comercio_id ?? "");
          const productoId =
            typeof payload.producto_id === "string" && payload.producto_id.trim()
              ? payload.producto_id
              : null;
          const channel = isAllowed(payload.channel, CHANNELS) ? payload.channel : "web";
          const source = isAllowed(payload.source, SOURCES) ? payload.source : "unknown";

          if (!isAllowed(eventType, EVENT_TYPES)) {
            return errorResponse("event_type inválido", 400);
          }
          if (!UUID_RE.test(comercioId)) {
            return errorResponse("comercio_id inválido", 400);
          }
          if (productoId && !UUID_RE.test(productoId)) {
            return errorResponse("producto_id inválido", 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const authHeader = request.headers.get("authorization");
          const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
          const userRes = token ? await supabaseAdmin.auth.getUser(token).catch(() => null) : null;
          const clienteId = userRes?.data?.user?.id ?? null;

          const { error } = await supabaseAdmin.from("lead_events").insert({
            comercio_id: comercioId,
            producto_id: productoId,
            cliente_id: clienteId,
            event_type: eventType,
            channel,
            source,
            metadata: cleanMetadata(payload.metadata),
            user_agent: request.headers.get("user-agent"),
            ip_address: pickIp(request),
          });

          if (error) return errorResponse("Error al registrar evento", 500);

          return jsonResponse({ ok: true }, 201);
        } catch {
          return errorResponse("Error al registrar evento", 500);
        }
      },
    },
  },
});
