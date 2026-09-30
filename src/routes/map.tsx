import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { LocateFixed, MapPin, Navigation, Search, Star, Store, X } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriasQuery } from "@/lib/queries";
import { InteractiveStoreMap } from "@/components/map/InteractiveStoreMap";

const mapSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  categoria: fallback(z.coerce.number().int().positive().optional(), undefined),
  lat: fallback(z.coerce.number().min(-90).max(90).optional(), undefined),
  lng: fallback(z.coerce.number().min(-180).max(180).optional(), undefined),
  radioKm: fallback(z.coerce.number().min(1).max(50), 10).default(10),
});

type MapStore = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo_url: string | null;
  telefono: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  categoria_id: number | null;
  rating_avg: number | null;
  total_reviews: number | null;
  distancia_km: number | null;
};

export const Route = createFileRoute("/map")({
  validateSearch: zodValidator(mapSearchSchema),
  head: () => ({
    meta: [
      { title: "Mapa - Merkanta" },
      { name: "description", content: "Mapa interactivo de comercios del Centro de Barranquilla." },
    ],
  }),
  loader: ({ context }) => context.queryClient.prefetchQuery(categoriasQuery),
  component: MapPage,
});

function MapPage() {
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const search = useSearch({ from: "/map" });
  const [q, setQ] = useState(search.q);
  const searchTerm = useDeferredValue(q);
  const [categoria, setCategoria] = useState<string>(
    search.categoria ? String(search.categoria) : "all",
  );
  const [radioKm, setRadioKm] = useState(search.radioKm);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    search.lat != null && search.lng != null ? { lat: search.lat, lng: search.lng } : null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const storesQuery = useQuery({
    queryKey: [
      "map-stores",
      searchTerm,
      categoria,
      radioKm,
      coords?.lat ?? null,
      coords?.lng ?? null,
    ],
    queryFn: async (): Promise<MapStore[]> => {
      const params = new URLSearchParams();
      if (categoria !== "all") params.set("categoria", categoria);
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
        params.set("radio", String(radioKm));
      }
      const res = await fetch(`/api/stores?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "No pudimos cargar el mapa");
      return payload.comercios ?? [];
    },
    staleTime: 20_000,
  });

  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);

  const selected = stores.find((store) => store.id === selectedId) ?? null;
  const resultText = storesQuery.isLoading
    ? "Cargando comercios..."
    : `${stores.length} resultado${stores.length === 1 ? "" : "s"}${
        coords ? " ordenados por cercania" : " activos"
      }`;

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
      });
      setSelectedId(null);
    });
  };

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 py-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Centro de Barranquilla
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Explorar comercios
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Encuentra tiendas activas, compara cercania y abre rutas para llegar.
                  </p>
                </div>
                <div className="flex gap-1" aria-label="Vista de resultados">
                  <Button asChild variant="outline">
                    <Link
                      to="/search"
                      search={{
                        q,
                        categoria: categoria === "all" ? undefined : Number(categoria),
                        lat: coords?.lat,
                        lng: coords?.lng,
                        radioKm,
                        tab: "comercios",
                      }}
                    >
                      Lista
                    </Link>
                  </Button>
                  <Button aria-current="page">Mapa</Button>
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:grid-cols-[minmax(220px,1fr)_180px_120px_auto]">
                <div className="relative col-span-2 md:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar comercio o producto"
                    className="h-11 pl-9"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Select
                  value={categoria}
                  onValueChange={(value) => {
                    setCategoria(value);
                    setSelectedId(null);
                  }}
                >
                  <SelectTrigger className="col-span-2 h-11 md:col-span-1">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Label htmlFor="mapRadio" className="sr-only">
                    Radio
                  </Label>
                  <Input
                    id="mapRadio"
                    type="number"
                    min={1}
                    max={50}
                    value={radioKm}
                    onChange={(e) => setRadioKm(Number(e.target.value || 10))}
                    className="h-11 pr-10"
                    aria-label="Radio en kilometros"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 text-sm text-muted-foreground">
                    km
                  </span>
                </div>

                <Button type="button" onClick={useMyLocation} className="h-11">
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Cerca
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-4 px-4 py-4 lg:grid-cols-[1fr_380px]">
          <div className="relative overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-soft)]">
            <InteractiveStoreMap stores={stores} selectedId={selectedId} onSelect={setSelectedId} />
            {selected && (
              <div className="absolute bottom-12 left-3 right-3 z-[500] rounded-md border bg-background p-3 shadow-md md:hidden">
                <p className="truncate font-semibold">{selected.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{selected.direccion}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" asChild variant="outline">
                    <Link to="/store/$slug" params={{ slug: selected.slug }}>
                      Ver tienda
                    </Link>
                  </Button>
                  {selected.lat != null && selected.lng != null && (
                    <Button size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Cómo llegar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {selected ? selected.nombre : "Centro de Barranquilla"}
              </span>
              {coords && <span>Radio activo: {radioKm} km desde tu ubicacion</span>}
            </div>
          </div>

          <aside className="min-h-0 rounded-lg border bg-card shadow-[var(--shadow-soft)]">
            <div className="border-b p-4">
              <h2 className="font-semibold">Comercios encontrados</h2>
              <p className="text-sm text-muted-foreground">{resultText}</p>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-2">
              {storesQuery.isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : storesQuery.isError ? (
                <div className="p-4 text-sm text-destructive">No pudimos cargar los comercios.</div>
              ) : stores.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No hay comercios para esos filtros.
                </div>
              ) : (
                <ul className="space-y-2">
                  {stores.map((store) => (
                    <li key={store.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(store.id)}
                        className={`w-full rounded-lg border p-3 text-left transition hover:bg-muted/50 ${
                          selected?.id === store.id
                            ? "border-primary bg-primary-soft"
                            : "bg-background"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                            {store.logo_url ? (
                              <img
                                src={store.logo_url}
                                alt={store.nombre}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Store className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="truncate font-semibold">{store.nombre}</h3>
                              {store.distancia_km != null && (
                                <Badge variant="outline" className="shrink-0">
                                  {store.distancia_km < 1
                                    ? `${Math.round(store.distancia_km * 1000)} m`
                                    : `${store.distancia_km.toFixed(1)} km`}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                              {(store.rating_avg ?? 0).toFixed(1)} ({store.total_reviews ?? 0})
                            </div>
                            {store.direccion && (
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {store.direccion}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected && (
              <div className="border-t p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <Link to="/store/$slug" params={{ slug: selected.slug }}>
                      Ver tienda
                    </Link>
                  </Button>
                  {selected.lat != null && selected.lng != null && (
                    <Button asChild>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        Ruta
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
