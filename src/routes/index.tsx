import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Sparkles, Store, ArrowRight, Tag,
  Utensils, Wine, Shirt, Home as HomeIcon, Laptop, Sparkle,
  HeartPulse, Wrench, PawPrint, Dumbbell, Gamepad2, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "cerca — Comercios y productos de tu barrio" },
      { name: "description", content: "Descubrí comercios locales, productos y promociones a metros de tu casa. Buscá por categoría, zona o cercanía." },
      { property: "og:title", content: "cerca — Marketplace de tu barrio" },
      { property: "og:description", content: "Comercios locales y productos a metros de tu casa." },
    ],
  }),
  component: Home,
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  alimentos: Utensils, bebidas: Wine, ropa: Shirt, hogar: HomeIcon,
  tecnologia: Laptop, belleza: Sparkle, salud: HeartPulse, servicios: Wrench,
  mascotas: PawPrint, deportes: Dumbbell, jugueteria: Gamepad2, libreria: BookOpen,
};

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const categories = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, slug, color")
        .eq("activa", true)
        .is("padre_id", null)
        .order("orden")
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const featuredStores = useQuery({
    queryKey: ["home-featured-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comercios")
        .select("id, nombre, slug, descripcion_corta, logo_url, banner_url, rating_promedio, total_reviews")
        .eq("estado", "activo")
        .is("deleted_at", null)
        .order("rating_promedio", { ascending: false, nullsFirst: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const featuredProducts = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, imagen_url, comercio_id, comercios(nombre, slug)")
        .eq("disponible", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as never });
  };

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,_var(--color-primary-soft)_0%,_transparent_70%)]" />
        <div className="absolute -right-24 top-10 hidden h-72 w-72 rounded-full bg-secondary/40 blur-3xl md:block" />
        <div className="absolute -left-24 bottom-0 hidden h-72 w-72 rounded-full bg-accent/30 blur-3xl md:block" />

        <div className="container relative mx-auto px-4 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1 rounded-full px-3 py-1">
              <Sparkles className="h-3 w-3" /> Marketplace local con IA
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Todo lo que necesitás,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                a la vuelta de tu casa
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Descubrí comercios, productos y promociones de tu barrio. Sin apps, sin vueltas — todo en un solo lugar.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="¿Qué buscás? ej: empanadas, ferretería, ropa…"
                  className="h-14 rounded-full border-2 pl-12 pr-4 text-base shadow-sm focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 rounded-full px-8 text-base">
                Buscar
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Probá:</span>
              {["pizza", "veterinaria", "café de especialidad", "ropa de bebé"].map((s) => (
                <button
                  key={s}
                  onClick={() => navigate({ to: "/search", search: { q: s } as never })}
                  className="rounded-full border bg-background/60 px-3 py-1 text-xs hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Explorá por categoría</h2>
            <p className="mt-1 text-sm text-muted-foreground">Encontrá comercios por rubro.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {(categories.data ?? Array.from({ length: 12 })).map((cat, i) => {
            const c = cat as { id: number; nombre: string; slug: string; color?: string } | undefined;
            const Icon = c ? iconMap[c.slug] ?? Tag : Tag;
            return (
              <Link
                key={c?.id ?? i}
                to="/search"
                search={{ categoria: c?.slug ?? "" } as never}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl transition-colors"
                  style={{ backgroundColor: c?.color ? `${c.color}22` : "var(--muted)", color: c?.color ?? "var(--primary)" }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium">{c?.nombre ?? "—"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* COMERCIOS DESTACADOS */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Comercios destacados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Los mejor valorados de tu zona.</p>
          </div>
          <Link to="/search" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredStores.data && featuredStores.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStores.data.map((s) => (
              <Link key={s.id} to="/store/$slug" params={{ slug: s.slug } as never} className="group">
                <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    {s.banner_url ? (
                      <img src={s.banner_url} alt={s.nombre} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center bg-gradient-to-br from-primary-soft to-secondary">
                        <Store className="h-10 w-10 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-background">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground"><Store className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display font-semibold">{s.nombre}</h3>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{s.descripcion_corta ?? "Comercio local"}</p>
                        {s.total_reviews && s.total_reviews > 0 ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            ★ {Number(s.rating_promedio ?? 0).toFixed(1)} · {s.total_reviews} reseñas
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyHint
            icon={<Store className="h-6 w-6" />}
            title="Pronto vas a ver comercios acá"
            desc="Cuando los comercios de tu zona se sumen, los vas a encontrar destacados aquí."
            cta={{ label: "Registrá tu comercio", to: "/auth" }}
          />
        )}
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Productos nuevos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lo último publicado por los comercios.</p>
          </div>
        </div>
        {featuredProducts.data && featuredProducts.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.data.map((p) => {
              const com = (p as unknown as { comercios?: { slug: string; nombre: string } }).comercios;
              return (
                <Card key={p.id} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground"><Tag className="h-6 w-6" /></div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="line-clamp-2 text-sm font-medium">{p.nombre}</h4>
                    {p.precio != null && (
                      <p className="mt-1 font-display text-base font-bold text-primary">
                        ${Number(p.precio).toLocaleString("es-AR")}
                      </p>
                    )}
                    {com && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{com.nombre}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyHint
            icon={<Tag className="h-6 w-6" />}
            title="Todavía no hay productos publicados"
            desc="Apenas los comercios publiquen su catálogo, vas a verlos acá."
          />
        )}
      </section>

      {/* MAPA PREVIEW */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_var(--color-primary-soft)_0%,_var(--color-secondary)_100%)] opacity-60" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, var(--color-primary) 0 4px, transparent 5px), radial-gradient(circle at 70% 60%, var(--color-primary) 0 4px, transparent 5px), radial-gradient(circle at 45% 80%, var(--color-primary) 0 4px, transparent 5px), radial-gradient(circle at 85% 25%, var(--color-primary) 0 4px, transparent 5px), radial-gradient(circle at 30% 65%, var(--color-primary) 0 4px, transparent 5px)",
            }}
          />
          <div className="relative grid gap-6 p-8 md:grid-cols-2 md:p-12">
            <div>
              <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> Mapa interactivo</Badge>
              <h3 className="mt-3 font-display text-2xl font-bold md:text-3xl">
                Ubicá los comercios en el mapa
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Explorá todo lo que hay cerca tuyo. Filtrá por rubro, distancia y promociones activas.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="lg"><Link to="/map">Abrir mapa</Link></Button>
                <Button asChild variant="outline" size="lg"><Link to="/search">Buscar cerca</Link></Button>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      {/* CTA Comercios */}
      <section className="container mx-auto px-4 pb-16 pt-8">
        <div className="rounded-3xl bg-foreground p-10 text-background md:p-14">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-bold md:text-3xl">¿Tenés un comercio?</h3>
              <p className="mt-2 max-w-md text-sm opacity-80">
                Llegá a tu barrio en minutos. Publicá tus productos, lanzá promociones y recibí consultas directo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ mode: "signup" } as never}>Sumá tu comercio</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10">
                <Link to="/dashboard">Acceder al panel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function EmptyHint({ icon, title, desc, cta }: { icon: React.ReactNode; title: string; desc: string; cta?: { label: string; to: string } }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-background text-muted-foreground">{icon}</div>
      <h4 className="mt-3 font-display text-lg font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      {cta && (
        <Button asChild className="mt-4" variant="outline">
          <Link to={cta.to as "/auth"}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
