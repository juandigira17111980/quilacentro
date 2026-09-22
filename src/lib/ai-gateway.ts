// Server-side OpenAI-compatible AI client. The provider is selected by runtime
// configuration so Mercanta remains independent from its original builder.
type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(
  messages: Msg[],
  opts: { model?: string; json?: boolean } = {},
): Promise<string> {
  const baseUrl = process.env.AI_API_BASE_URL?.replace(/\/$/, "");
  const key = process.env.AI_API_KEY;
  if (!baseUrl || !key) throw new Error("La asistencia de IA no está configurada");

  const body: Record<string, unknown> = {
    model: opts.model ?? process.env.AI_MODEL ?? "gpt-5-mini",
    messages,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Límite de uso alcanzado. Intenta más tarde.");
    if (res.status === 402) throw new Error("Créditos de IA agotados.");
    throw new Error(`Servicio de IA ${res.status}: ${text.slice(0, 200)}`);
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
