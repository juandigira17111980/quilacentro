import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Send, Sparkles, X, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type ProductoLite = {
  id: string;
  nombre: string;
  slug: string;
  precio_base: number;
  precio_oferta: number | null;
  imagen_url: string | null;
};
type ComercioLite = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  rating_avg: number | null;
};
type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; productos?: ProductoLite[]; comercios?: ComercioLite[] };

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: '¡Hola! Soy el asistente de QuillacentrO. Contame qué buscás (por ejemplo: "una plancha para cabello que no cueste más de 80 mil") y te muestro opciones del Centro.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error en el asistente");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.mensaje || "Estos son los resultados que encontré:",
          productos: data.productos ?? [],
          comercios: data.comercios ?? [],
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No pude procesar tu consulta";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente IA"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-elevated,0_10px_30px_rgba(0,0,0,0.2))] transition hover:scale-105 md:bottom-7 md:right-7"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          <Sparkles className="h-3 w-3" />
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-accent" /> Asistente QuillacentrO
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground">{m.text}</p>
                    {m.productos && m.productos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Productos sugeridos
                        </p>
                        {m.productos.slice(0, 5).map((p) => (
                          <Link
                            key={p.id}
                            to="/product/$id"
                            params={{ id: p.id }}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl border bg-card p-2 transition hover:bg-muted/50"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              {p.imagen_url && (
                                <img
                                  src={p.imagen_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{p.nombre}</div>
                              <div className="text-xs font-semibold text-primary">
                                ${Number(p.precio_oferta ?? p.precio_base).toLocaleString("es-CO")}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {m.comercios && m.comercios.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Comercios</p>
                        {m.comercios.slice(0, 3).map((c) => (
                          <Link
                            key={c.id}
                            to="/store/$slug"
                            params={{ slug: c.slug }}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl border bg-card p-2 transition hover:bg-muted/50"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                              {c.logo_url ? (
                                <img
                                  src={c.logo_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Store className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{c.nombre}</div>
                              {c.rating_avg ? (
                                <div className="text-xs text-muted-foreground">
                                  ★ {Number(c.rating_avg).toFixed(1)}
                                </div>
                              ) : null}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t bg-background p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí lo que buscás..."
              disabled={loading}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
