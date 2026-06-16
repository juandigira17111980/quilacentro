import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import type { Producto } from "@/lib/queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function FeaturedProductCard({ p }: { p: Producto }) {
  const hasOferta = p.precio_oferta != null && p.precio_oferta < p.precio_base;
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {p.imagen_url ? (
          <img
            src={p.imagen_url}
            alt={p.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            Sin imagen
          </div>
        )}
        {hasOferta && (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            Oferta
          </span>
        )}
        {p.destacado && (
          <span className="absolute right-2 top-2 rounded-md bg-yellow-400 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow">
            ⭐ Destacado
          </span>
        )}
        {/* Slide-up CTA */}
        <div className="absolute inset-x-2 bottom-2 translate-y-[120%] transition-transform duration-300 group-hover:translate-y-0">
          <div className="rounded-lg bg-orange-500 py-2 text-center text-xs font-semibold text-white shadow-lg">
            Ver producto
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight">{p.nombre}</h3>
        {p.comercios?.nombre && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Store className="h-3 w-3 shrink-0" />
            <span className="truncate">{p.comercios.nombre}</span>
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {hasOferta ? (
            <>
              <span className="text-lg font-extrabold text-orange-600">
                {fmt(p.precio_oferta!)}
              </span>
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
