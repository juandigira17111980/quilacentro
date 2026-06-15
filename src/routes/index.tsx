import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Search, Store } from "lucide-react";

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
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,_var(--color-primary-soft)_0%,_transparent_70%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 text-accent" /> Centro de Barranquilla
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              El Centro, en tu bolsillo.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Encontrá lo que buscás y descubrí los comercios físicos que lo venden — precios, distancia y contacto directo.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/search">
                  <Search className="mr-2 h-4 w-4" /> Buscar productos
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/map">
                  <MapPin className="mr-2 h-4 w-4" /> Ver mapa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-4 px-4 py-16 md:grid-cols-3">
        {[
          { icon: Search, title: "Buscá lo que necesitás", desc: "Productos, marcas y categorías del Centro." },
          { icon: MapPin, title: "Mirá dónde está", desc: "Mapa con distancia desde donde estás." },
          { icon: Store, title: "Hablá con el comercio", desc: "WhatsApp, llamada o visita directa." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      <section className="container mx-auto px-4 pb-20">
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
