import { Link, createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/site/AppShell";
import { ProductCardSkeleton } from "@/components/cards/ProductCard";
import { StoreCardSkeleton } from "@/components/cards/StoreCard";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { OffersBanner } from "@/components/home/OffersBanner";
import { FeaturedProductCard } from "@/components/home/FeaturedProductCard";
import { StoreRowCard } from "@/components/home/StoreRowCard";
import { MerchantCta } from "@/components/home/MerchantCta";
import { Reveal } from "@/components/home/Reveal";
import { categoriasQuery, productosDestacadosQuery, comerciosDestacadosQuery } from "@/lib/queries";

const homeSearch = z.object({
  denied: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mercanta — Comercio local del Centro de Barranquilla" },
      {
        name: "description",
        content:
          "Busca menos. Encuentra más. Descubre productos y comercios reales del Centro de Barranquilla.",
      },
    ],
  }),
  validateSearch: zodValidator(homeSearch),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(categoriasQuery);
    void context.queryClient.prefetchQuery(productosDestacadosQuery);
    void context.queryClient.prefetchQuery(comerciosDestacadosQuery);
  },
  component: HomePage,
});

function HomePage() {
  const { denied } = useSearch({ from: "/" });
  useEffect(() => {
    if (denied) toast.error("No tenés permiso para acceder a esa sección.");
  }, [denied]);

  return (
    <AppShell>
      <HeroSection />
      <StatsBar />

      {/* CATEGORÍAS */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <Reveal>
          <SectionTitle
            title="Encuentra lo que necesitas por tipo"
            subtitle="Elige una categoría para filtrar productos y comercios cerca de ti."
          />
        </Reveal>
        <Reveal delay={100}>
          <CategoriasSection />
        </Reveal>
      </section>

      {/* BANNER OFERTAS */}
      <section className="container mx-auto px-4 pb-14 md:pb-20">
        <Reveal>
          <OffersBanner />
        </Reveal>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container mx-auto px-4 pb-14 md:pb-20">
        <Reveal>
          <SectionTitle title="Productos que están buscando" decorated prominent />
        </Reveal>
        <Reveal delay={100}>
          <ProductosSection />
        </Reveal>
      </section>

      {/* COMERCIOS */}
      <section className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <Reveal>
            <SectionTitle
              title="Comercios para descubrir hoy"
              decorated
              prominent
              action={
                <Button
                  asChild
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Link to="/search" search={{ tab: "comercios" }}>
                    Ver todos los comercios
                  </Link>
                </Button>
              }
            />
          </Reveal>
          <Reveal delay={100}>
            <ComerciosSection />
          </Reveal>
        </div>
      </section>

      <MerchantCta />
    </AppShell>
  );
}

function SectionTitle({
  title,
  subtitle,
  decorated = false,
  prominent = false,
  action,
}: {
  title: string;
  subtitle?: string;
  decorated?: boolean;
  prominent?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2
          className={
            prominent
              ? "text-[1.625rem] font-black leading-tight tracking-normal sm:text-4xl md:text-5xl"
              : "text-2xl font-extrabold tracking-tight md:text-4xl"
          }
        >
          {title}
        </h2>
        {decorated && <div className="mt-3 h-1 w-14 bg-brand-gold" />}
        {subtitle && <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function CategoriasSection() {
  const { data } = useSuspenseQuery(categoriasQuery);
  return <CategoryShowcase categorias={data} />;
}

function ProductosSection() {
  const { data } = useSuspenseQuery(productosDestacadosQuery);
  if (data.length === 0) {
    return <EmptyHint text="Aún no hay productos destacados." />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data.slice(0, 8).map((p) => (
        <FeaturedProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function ComerciosSection() {
  const { data } = useSuspenseQuery(comerciosDestacadosQuery);
  if (data.length === 0) {
    return <EmptyHint text="Aún no hay comercios para mostrar." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.slice(0, 6).map((c, i) => (
        <StoreRowCard key={c.id} c={c} index={i} />
      ))}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted">
        <Store className="h-5 w-5" />
      </span>
      {text}
    </div>
  );
}

export { ProductCardSkeleton, StoreCardSkeleton };
