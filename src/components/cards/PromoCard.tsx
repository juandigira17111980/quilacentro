import { Badge } from "@/components/ui/badge";
import type { Promocion } from "@/lib/queries";

const tipoLabel: Record<string, string> = {
  descuento_pct: "% Descuento",
  descuento_monto: "Descuento",
  "2x1": "2x1",
  envio_gratis: "Envío gratis",
  combo: "Combo",
};

export function PromoCard({ p }: { p: Promocion }) {
  const label =
    p.tipo === "descuento_pct" && p.valor ? `-${Math.round(p.valor)}%` : tipoLabel[p.tipo] ?? p.tipo;
  return (
    <div className="relative w-[280px] shrink-0 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] md:w-[320px]">
      <div className="relative aspect-[16/10] bg-muted">
        {p.imagen_url ? (
          <img src={p.imagen_url} alt={p.titulo} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary to-primary/70" />
        )}
        <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground hover:bg-accent">
          {label}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{p.titulo}</h3>
        {p.comercios?.nombre && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{p.comercios.nombre}</p>
        )}
      </div>
    </div>
  );
}
