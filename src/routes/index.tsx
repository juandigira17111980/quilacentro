import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, MapPin, Search, Store } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, ProductCardSkeleton } from "@/components/cards/ProductCard";
import { StoreCard, StoreCardSkeleton } from "@/components/cards/StoreCard";
import { PromoCard } from "@/components/cards/PromoCard";
import { CategoryGrid } from "@/components/cards/CategoryGrid";
import {
  categoriasQuery,
  productosDestacadosQuery,
  promocionesDestacadasQuery,
  comerciosDestacadosQuery,
} from "@/lib/queries";

const homeSearch = z.object({
  denied: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuillacentrO — Marketplace del Centro de Barranquilla" },
      {
        name: "description",
        content:
          "Descubrí productos y los comercios físicos del Centro de Barranquilla que los venden. Precios, distancia y contacto directo.",
      },
    ],
  }),
  validateSearch: zodValidator(homeSearch),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(categoriasQuery);
    void context.queryClient.prefetchQuery(productosDestacadosQuery);
    void context.queryClient.prefetchQuery(promocionesDestacadasQuery);
    void context.queryClient.prefetchQuery(comerciosDestacadosQuery);
  },
  component: HomePage,
});

function HomePage() {
  const { denied } = useSearch({ from: "/" });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (denied) toast.error("No tenés permiso para acceder a esa sección.");
  }, [denied]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/search",
      search: { q, categoria: undefined, precioMin: undefined, precioMax: undefined, conPromo: false, disponibles: true, tab: "productos" },
    });
  };

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,_rgba(255,255,255,0.18)_0%,_transparent_70%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
              <MapPin className="h-3 w-3" /> Centro de Barranquilla
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Encuentra todo lo que buscas en el Centro de Barranquilla
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base opacity-90 md:text-lg">
              Compara precios, descubre promociones y ubica las tiendas más cercanas.
            </p>
            <form
              onSubmit={onSearch}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 shadow-[var(--shadow-elevated)]"
            >
              <div className="flex flex-1 items-center gap-2 px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="¿Qué producto estás buscando?"
                  className="h-12 border-0 bg-transparent text-base text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90">
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container mx-auto px-4 py-14">
        <SectionHeader title="Explorá por categoría" />
        <CategoriasSection />
      </section>

      {/* PROMOCIONES */}
      <section className="border-y bg-muted/40">
        <div className="container mx-auto px-4 py-14">
          <SectionHeader title="Promociones destacadas" subtitle="Aprovechá las ofertas vigentes en los comercios del Centro." />
          <PromocionesSection />
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container mx-auto px-4 py-14">
        <SectionHeader
          title="Productos destacados"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/search" search={{ q: "", categoria: undefined, precioMin: undefined, precioMax: undefined, conPromo: false, disponibles: true, tab: "productos" }}>
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <ProductosSection />
      </section>

      {/* COMERCIOS */}
      <section className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-14">
          <SectionHeader
            title="Comercios mejor calificados"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/search" search={{ q: "", categoria: undefined, precioMin: undefined, precioMax: undefined, conPromo: false, disponibles: true, tab: "comercios" }}>
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <ComerciosSection />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">¿Tenés un comercio en el Centro?</h2>
            <p className="mt-2 max-w-md text-sm opacity-80">
              Publicá tus productos, promociones y recibí clientes directo a tu local.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth">
              Sumá tu comercio <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function CategoriasSection() {
  const { data } = useSuspenseQuery(categoriasQuery);
  return <CategoryGrid categorias={data} />;
}

function PromocionesSection() {
  const { data } = useSuspenseQuery(promocionesDestacadasQuery);
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay promociones destacadas por ahora.</p>;
  }
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
      {data.map((p) => (
        <PromoCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function ProductosSection() {
  const { data } = useSuspenseQuery(productosDestacadosQuery);
  if (data.length === 0) {
    return <EmptyHint icon={<Store className="h-5 w-5" />} text="Aún no hay productos destacados." />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function ComerciosSection() {
  const { data } = useSuspenseQuery(comerciosDestacadosQuery);
  if (data.length === 0) {
    return <EmptyHint icon={<Store className="h-5 w-5" />} text="Aún no hay comercios para mostrar." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <StoreCard key={c.id} c={c} />
      ))}
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted">{icon}</span>
      {text}
    </div>
  );
}

// Skeletons referenced for completeness (used by Search route).
export { ProductCardSkeleton, StoreCardSkeleton };
