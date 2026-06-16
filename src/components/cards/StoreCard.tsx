import { Link } from "@tanstack/react-router";
import { Camera, MapPin, Star, Store } from "lucide-react";
import type { Comercio } from "@/lib/queries";

export function StoreCard({ c }: { c: Comercio }) {
  return (
    <Link
      to="/store/$slug"
      params={{ slug: c.slug }}
      className="flex gap-4 rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {c.logo_url ? (
          <img src={c.logo_url} alt={c.nombre} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Store className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{c.nombre}</h3>
        {c.categorias?.nombre && (
          <p className="truncate text-xs text-muted-foreground">{c.categorias.nombre}</p>
        )}
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="font-medium">{(c.rating_avg ?? 0).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({c.total_reviews ?? 0})</span>
          </span>
          {c.tour_360_url && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              <Camera className="h-3 w-3" /> 360°
            </span>
          )}
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

export function StoreCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-4">
      <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
