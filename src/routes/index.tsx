import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { PromoCard } from "@/components/cards/PromoCard";
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
          <SectionTitle title="Explorá por categoría" />
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

      {/* PROMOCIONES */}
      <section className="border-y bg-muted/40">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <Reveal>
            <SectionTitle
              title="Promociones destacadas"
              subtitle="Aprovechá las ofertas vigentes en los comercios del Centro."
            />
          </Reveal>
          <Reveal delay={100}>
            <PromocionesSection />
          </Reveal>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <Reveal>
          <SectionTitle title="✨ Productos Destacados" decorated />
        </Reveal>
        <Reveal delay={100}>
          <ProductosSection />
        </Reveal>
      </section>

      {/* COMERCIOS */}
      <section className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <Reveal>
            <SectionTitle title="🏆 Mejores Comercios" decorated />
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
}: {
  title: string;
  subtitle?: string;
  decorated?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      {decorated && <div className="mt-2 h-1 w-16 rounded-full bg-orange-500" />}
      {subtitle && <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
    </div>
  );
}

function CategoriasSection() {
  const { data } = useSuspenseQuery(categoriasQuery);
  return <CategoryShowcase categorias={data} />;
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
