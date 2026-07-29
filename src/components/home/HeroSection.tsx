import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const POPULAR = ["Ropa", "Celulares", "Perfumes", "Hogar", "Belleza"];

export function HeroSection() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const go = (term: string) => {
    navigate({
      to: "/search",
      search: {
        q: term,
        categoria: undefined,
        precioMin: undefined,
        precioMax: undefined,
        conPromo: false,
        disponibles: true,
        tab: "productos",
      },
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(q);
  };

  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#1B1124] md:min-h-[710px]">
      <img
        src="/images/mercanta-centro-hero.png"
        alt="Comercio local en el Centro de Barranquilla"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-[#1B1124]/64" />

      <div className="container mx-auto flex min-h-[680px] items-end px-4 pb-14 pt-28 md:min-h-[710px] md:items-center md:pb-10 md:pt-20">
        <div className="max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-sm">
            <MapPin className="h-4 w-4 text-brand-gold" />
            Centro de Barranquilla, Colombia
          </div>

          <p className="mt-7 flex items-center gap-2 text-xs font-semibold text-brand-gold sm:text-sm">
            <Sparkles className="h-4 w-4" />
            TODO EL CENTRO DE BARRANQUILLA, A UN CLIC
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.02] sm:text-5xl md:text-[4rem]">
            Busca menos.
            <span className="block text-brand-gold">Encuentra más.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/80 md:text-lg">
            Descubre lo que necesitas en comercios reales del Centro. Compara, consulta y elige cómo
            recibirlo.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 flex w-full max-w-xl flex-col gap-2 bg-white p-2 shadow-[0_18px_54px_-18px_rgba(0,0,0,0.7)] sm:flex-row"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-brand-teal" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Encuentra cerca lo que necesitas..."
                className="h-12 border-0 bg-transparent px-0 text-base text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-md bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              Buscar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span>Popular:</span>
            {POPULAR.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => go(term)}
                className="border border-white/25 bg-white/10 px-3 py-1.5 font-medium text-white transition hover:border-brand-gold hover:bg-white/20"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
