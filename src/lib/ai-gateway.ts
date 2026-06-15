// Helper para llamar Lovable AI Gateway (server-side only)
type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(
  messages: Msg[],
  opts: { model?: string; json?: boolean } = {},
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY no configurada");

  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-3-flash-preview",
    messages,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Límite de uso alcanzado. Intenta más tarde.");
    if (res.status === 402) throw new Error("Créditos de IA agotados.");
    throw new Error(`AI Gateway ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export function parseJSON<T = unknown>(text: string): T {
  // Modelos pueden envolver en ```json
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}
