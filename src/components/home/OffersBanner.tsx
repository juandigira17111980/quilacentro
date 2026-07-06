import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function OffersBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 p-6 shadow-2xl md:p-10">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-orange-300/60 ring-offset-2 ring-offset-transparent animate-pulse" />
      <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex-1 text-white">
          <h3 className="text-2xl font-extrabold tracking-tight md:text-4xl">🔥 OFERTAS DEL DÍA</h3>
          <p className="mt-2 text-white/90 md:text-lg">
            Descuentos de hasta 50% en productos seleccionados
          </p>
          <Button
            asChild
            size="lg"
            className="mt-4 rounded-full bg-white font-bold text-orange-600 hover:bg-white/90"
          >
            <Link
              to="/search"
              search={{
                q: "",
                categoria: undefined,
                precioMin: undefined,
                precioMax: undefined,
                conPromo: true,
                disponibles: true,
                tab: "productos",
              }}
            >
              Ver todas las ofertas
            </Link>
          </Button>
        </div>
        <img
          src="https://picsum.photos/seed/quillaofertas/400/200"
          alt="Ofertas"
          className="h-40 w-full max-w-sm rounded-2xl object-cover shadow-xl md:h-48"
          loading="lazy"
        />
      </div>
    </div>
  );
}
