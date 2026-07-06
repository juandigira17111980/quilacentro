export type LeadEventType = "whatsapp_click" | "directions_click" | "availability_submit";
export type LeadEventChannel = "web" | "whatsapp" | "maps" | "platform";
export type LeadEventSource = "product_detail" | "store_detail" | "map" | "search" | "unknown";

export type TrackLeadEventInput = {
  eventType: LeadEventType;
  comercioId: string;
  productoId?: string | null;
  channel?: LeadEventChannel;
  source?: LeadEventSource;
  metadata?: Record<string, unknown>;
};

export function trackLeadEvent(input: TrackLeadEventInput) {
  if (typeof window === "undefined") return Promise.resolve();

  return fetch("/api/lead-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: input.eventType,
      comercio_id: input.comercioId,
      producto_id: input.productoId ?? null,
      channel: input.channel ?? "web",
      source: input.source ?? "unknown",
      metadata: input.metadata ?? {},
    }),
    keepalive: true,
  }).catch(() => {
    // Tracking must never block a commercial CTA.
  });
}
