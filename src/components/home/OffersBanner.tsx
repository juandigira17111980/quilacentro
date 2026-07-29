import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function OffersBanner() {
  return (
    <div className="relative overflow-hidden border border-brand-gold/30 bg-[#3B1165] p-6 shadow-[var(--shadow-elevated)] md:p-10">
      <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex-1 text-white">
          <p className="text-sm font-semibold text-brand-gold">OFERTAS ESPECIALES</p>
          <h3 className="mt-2 text-2xl font-extrabold md:text-4xl">
            Hoy puede estar más cerca de lo que buscas
          </h3>
          <p className="mt-2 text-white/90 md:text-lg">
            Descuentos, combos y oportunidades activas en comercios del Centro de Barranquilla.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-5 rounded-md bg-brand-gold font-bold text-[#1B1124] hover:bg-brand-gold/90"
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
          src="/images/mercanta-centro-barranquilla.png"
          alt="Comercio del Centro de Barranquilla"
          className="h-40 w-full max-w-sm object-cover object-right shadow-xl md:h-48"
          loading="lazy"
        />
      </div>
    </div>
  );
}
