import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  LocateFixed,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard, ProductCardSkeleton } from "@/components/cards/ProductCard";
import { StoreCard, StoreCardSkeleton } from "@/components/cards/StoreCard";
import {
  buildSearchProductsQuery,
  buildSearchComerciosQuery,
  categoriasQuery,
  type SearchFilters,
} from "@/lib/queries";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  categoria: fallback(z.coerce.number().int().positive().optional(), undefined),
  precioMin: fallback(z.coerce.number().nonnegative().optional(), undefined),
  precioMax: fallback(z.coerce.number().nonnegative().optional(), undefined),
  conPromo: fallback(z.coerce.boolean(), false).default(false),
  disponibles: fallback(z.coerce.boolean(), true).default(true),
  lat: fallback(z.coerce.number().min(-90).max(90).optional(), undefined),
  lng: fallback(z.coerce.number().min(-180).max(180).optional(), undefined),
  radioKm: fallback(z.coerce.number().positive(), 10).default(10),
  tab: fallback(z.enum(["productos", "comercios"]), "productos").default("productos"),
});

type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Buscar — QuillacentrO" },
      {
        name: "description",
        content: "Buscá productos en los comercios físicos del Centro de Barranquilla.",
      },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.prefetchQuery(categoriasQuery),
  component: SearchPage,
});

function SearchPage() {
  const search = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });

  // Debounced text input
  const [qLocal, setQLocal] = useState(search.q);
  useEffect(() => setQLocal(search.q), [search.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal !== search.q) {
        navigate({ search: (prev: SearchParams) => ({ ...prev, q: qLocal }), replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [qLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: SearchFilters = {
    q: search.q,
    categoria: search.categoria ?? null,
    precioMin: search.precioMin ?? null,
    precioMax: search.precioMax ?? null,
    conPromo: search.conPromo,
    disponibles: search.disponibles,
    lat: search.lat ?? null,
    lng: search.lng ?? null,
    radioKm: search.radioKm ?? 10,
  };

  const setFilter = <K extends keyof typeof search>(
    key: K,
    value: (typeof search)[K] | undefined,
  ) => navigate({ search: (prev: SearchParams) => ({ ...prev, [key]: value }), replace: true });

  const clearFilters = () =>
    navigate({
      search: {
        q: "",
        categoria: undefined,
        precioMin: undefined,
        precioMax: undefined,
        conPromo: false,
        disponibles: true,
        lat: undefined,
        lng: undefined,
        radioKm: 10,
        tab: search.tab,
      },
      replace: true,
    });

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      navigate({
        search: (prev: SearchParams) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          radioKm: prev.radioKm ?? 10,
        }),
        replace: true,
      });
    });
  };

  const clearLocation = () =>
    navigate({
      search: (prev: SearchParams) => ({
        ...prev,
        lat: undefined,
        lng: undefined,
        radioKm: 10,
      }),
      replace: true,
    });

  const FiltersBlock = (
    <FiltersPanel
      search={search}
      onChange={setFilter}
      onClear={clearFilters}
      onUseLocation={useMyLocation}
      onClearLocation={clearLocation}
    />
  );

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Search bar */}
        <div className="mb-6 flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="¿Qué producto estás buscando?"
              className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {qLocal && (
              <button
                onClick={() => setQLocal("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{FiltersBlock}</div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Desktop filters */}
          <aside className="hidden md:block">
            <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
              <h2 className="mb-4 text-sm font-semibold">Filtros</h2>
              {FiltersBlock}
            </div>
          </aside>

          {/* Results */}
          <section>
            <Tabs
              value={search.tab}
              onValueChange={(v) =>
                navigate({
                  search: (prev: SearchParams) => ({
                    ...prev,
                    tab: v as "productos" | "comercios",
                  }),
                  replace: true,
                })
              }
            >
              <TabsList>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="comercios">Comercios</TabsTrigger>
              </TabsList>
              <TabsContent value="productos" className="mt-4">
                <ProductosResults filters={filters} />
              </TabsContent>
              <TabsContent value="comercios" className="mt-4">
                <ComerciosResults filters={filters} />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function FiltersPanel({
  search,
  onChange,
  onClear,
  onUseLocation,
  onClearLocation,
}: {
  search: z.infer<typeof searchSchema>;
  onChange: <K extends keyof z.infer<typeof searchSchema>>(
    k: K,
    v: z.infer<typeof searchSchema>[K] | undefined,
  ) => void;
  onClear: () => void;
  onUseLocation: () => void;
  onClearLocation: () => void;
}) {
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const hasLocation = search.lat != null && search.lng != null;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/30 p-3">
        <Label className="text-xs font-medium uppercase text-muted-foreground">Cercania</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={hasLocation ? "default" : "outline"}
            size="sm"
            onClick={onUseLocation}
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {hasLocation ? "Ubicacion activa" : "Usar mi ubicacion"}
          </Button>
          {hasLocation && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearLocation}>
              Quitar
            </Button>
          )}
        </div>
        {hasLocation && (
          <div className="mt-3">
            <Label htmlFor="radioKm" className="text-xs text-muted-foreground">
              Radio: {search.radioKm} km
            </Label>
            <Input
              id="radioKm"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={search.radioKm}
              onChange={(e) => onChange("radioKm", Number(e.target.value || 10) as never)}
              className="mt-1.5"
            />
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs font-medium uppercase text-muted-foreground">Categoría</Label>
        <Select
          value={search.categoria ? String(search.categoria) : "all"}
          onValueChange={(v) =>
            onChange("categoria", v === "all" ? undefined : (Number(v) as never))
          }
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label
            htmlFor="precioMin"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Precio mín.
          </Label>
          <Input
            id="precioMin"
            type="number"
            inputMode="numeric"
            min={0}
            value={search.precioMin ?? ""}
            onChange={(e) =>
              onChange("precioMin", e.target.value ? (Number(e.target.value) as never) : undefined)
            }
            className="mt-1.5"
            placeholder="0"
          />
        </div>
        <div>
          <Label
            htmlFor="precioMax"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Precio máx.
          </Label>
          <Input
            id="precioMax"
            type="number"
            inputMode="numeric"
            min={0}
            value={search.precioMax ?? ""}
            onChange={(e) =>
              onChange("precioMax", e.target.value ? (Number(e.target.value) as never) : undefined)
            }
            className="mt-1.5"
            placeholder="∞"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={search.conPromo}
          onCheckedChange={(v) => onChange("conPromo", Boolean(v) as never)}
        />
        Solo con promoción
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={search.disponibles}
          onCheckedChange={(v) => onChange("disponibles", Boolean(v) as never)}
        />
        Solo disponibles
      </label>

      <Button variant="outline" size="sm" onClick={onClear} className="w-full">
        Limpiar filtros
      </Button>
    </div>
  );
}

function ProductosResults({ filters }: { filters: SearchFilters }) {
  const { data, isLoading, isError } = useQuery(buildSearchProductsQuery(filters));
  const usingLocation = filters.lat != null && filters.lng != null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-destructive">Error al cargar resultados.</p>;
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <Empty
        title="No encontramos productos"
        description="Probá ajustar los filtros o el término de búsqueda."
      />
    );
  }
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        {items.length} producto{items.length === 1 ? "" : "s"} encontrado
        {items.length === 1 ? "" : "s"}
        {usingLocation && (
          <span className="ml-2 inline-flex items-center gap-1 font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            ordenados por cercania
          </span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </>
  );
}

function ComerciosResults({ filters }: { filters: SearchFilters }) {
  const { data, isLoading, isError } = useQuery(buildSearchComerciosQuery(filters));
  const usingLocation = filters.lat != null && filters.lng != null;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-destructive">Error al cargar resultados.</p>;
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <Empty title="No encontramos comercios" description="Probá con otra categoría o término." />
    );
  }
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        {items.length} comercio{items.length === 1 ? "" : "s"} encontrado
        {items.length === 1 ? "" : "s"}
        {usingLocation && (
          <span className="ml-2 inline-flex items-center gap-1 font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            ordenados por cercania
          </span>
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <StoreCard key={c.id} c={c} />
        ))}
      </div>
    </>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Store className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
