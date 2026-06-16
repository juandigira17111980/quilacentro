import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const POPULAR = ["Plancha para cabello", "Zapatos", "Celulares", "Perfumes", "Ropa"];

export function HeroSection() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * 0.3);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(q);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Parallax background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80')",
          transform: `translateY(${offset}px) scale(1.1)`,
        }}
      />
      {/* Diagonal overlay: black 70% bottom-left → transparent top-right */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-black/80 via-black/50 to-transparent" />

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center text-white">
        {/* Badge */}
        <span
          className="inline-flex animate-in fade-in slide-in-from-top-4 items-center gap-2 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg duration-700 md:text-sm"
          style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
        >
          🛍️ +500 productos · 20 comercios · Centro de Barranquilla
        </span>

        {/* Title */}
        <h1
          className="mt-6 max-w-5xl animate-in fade-in slide-in-from-bottom-6 text-4xl font-extrabold leading-[1.05] tracking-tight duration-700 sm:text-6xl md:text-7xl"
          style={{ animationDelay: "250ms", animationFillMode: "backwards" }}
        >
          Todo el Centro de
          <br />
          <span className="text-orange-500">Barranquilla</span>
          <br />
          en un solo lugar
        </h1>

        {/* Subtitle */}
        <p
          className="mt-5 max-w-2xl animate-in fade-in text-base text-white/80 duration-700 md:text-lg"
          style={{ animationDelay: "450ms", animationFillMode: "backwards" }}
        >
          Busca productos, compara precios y encuentra las mejores tiendas cerca de ti
        </p>

        {/* Search bar */}
        <form
          onSubmit={onSubmit}
          className="mt-8 flex w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl duration-700"
          style={{ animationDelay: "600ms", animationFillMode: "backwards" }}
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué producto estás buscando hoy?"
              className="h-12 border-0 bg-transparent text-base text-foreground shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-xl bg-orange-500 px-6 text-white hover:bg-orange-600"
          >
            Buscar
          </Button>
        </form>

        {/* Popular chips */}
        <div
          className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2 animate-in fade-in duration-700"
          style={{ animationDelay: "800ms", animationFillMode: "backwards" }}
        >
          {POPULAR.map((p) => (
            <button
              key={p}
              onClick={() => go(p)}
              className="rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-white/30 md:text-sm"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90">
        <span className="text-xs font-medium">Descubre más</span>
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </div>
    </section>
  );
}
