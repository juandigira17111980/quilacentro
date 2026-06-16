import { Link } from "@tanstack/react-router";
import { MapPin, Star, Store } from "lucide-react";
import type { Comercio } from "@/lib/queries";

const borderColors = [
  "border-l-rose-500",
  "border-l-blue-500",
  "border-l-amber-500",
  "border-l-emerald-500",
  "border-l-fuchsia-500",
  "border-l-cyan-500",
];
const badgeColors = [
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-cyan-100 text-cyan-700",
];

export function StoreRowCard({ c, index = 0 }: { c: Comercio; index?: number }) {
  const bColor = borderColors[index % borderColors.length];
  const badge = badgeColors[index % badgeColors.length];
  return (
    <Link
      to="/store/$slug"
      params={{ slug: c.slug }}
      className={`group flex items-center gap-4 rounded-2xl border border-l-4 ${bColor} bg-card p-4 shadow-sm transition-all duration-300 hover:border-orange-400 hover:bg-orange-50/60 hover:shadow-lg`}
    >
      <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-white">
        {c.logo_url ? (
          <img
            src={c.logo_url}
            alt={c.nombre}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Store className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold">{c.nombre}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {c.categorias?.nombre && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
              {c.categorias.nombre}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
            <span className="font-bold">{(c.rating_avg ?? 0).toFixed(1)}</span>
            <span className="text-muted-foreground">({c.total_reviews ?? 0})</span>
          </span>
        </div>
        {c.direccion && (
          <p className="mt-1 flex items-start gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="truncate">{c.direccion}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
