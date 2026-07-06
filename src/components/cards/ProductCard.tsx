import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Producto } from "@/lib/queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductCard({ p }: { p: Producto }) {
  const hasOferta = p.precio_oferta != null && p.precio_oferta < p.precio_base;
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {p.imagen_url ? (
          <img
            src={p.imagen_url}
            alt={p.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            Sin imagen
          </div>
        )}
        {hasOferta && (
          <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground hover:bg-accent">
            OFERTA
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">{p.nombre}</h3>
        {p.comercios?.nombre && (
          <p className="truncate text-xs text-muted-foreground">{p.comercios.nombre}</p>
        )}
        {p.distancia_km != null && (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <MapPin className="h-3 w-3" />
            {p.distancia_km < 1
              ? `${Math.round(p.distancia_km * 1000)} m`
              : `${p.distancia_km.toFixed(1)} km`}
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {hasOferta ? (
            <>
              <span className="text-base font-bold text-accent">{fmt(p.precio_oferta!)}</span>
              <span className="text-xs text-muted-foreground line-through">
                {fmt(p.precio_base)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold">{fmt(p.precio_base)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
