import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

const BARRANQUILLA_CENTER = { lat: 10.9685, lng: -74.7813 };

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
  head: () => ({
    meta: [
      { title: "Mapa - QuillacentrO" },
      { name: "description", content: "Mapa interactivo de comercios del Centro de Barranquilla." },
    ],
  }),
  loader: ({ context }) => context.queryClient.prefetchQuery(categoriasQuery),
  component: MapPage,
});

function MapPage() {
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string>("all");
  const [radioKm, setRadioKm] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const storesQuery = useQuery({
    queryKey: ["map-stores", categoria, radioKm, coords?.lat ?? null, coords?.lng ?? null],
    queryFn: async (): Promise<MapStore[]> => {
      const params = new URLSearchParams();
      if (categoria !== "all") params.set("categoria", categoria);
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

  const stores = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = storesQuery.data ?? [];
    if (!term) return rows;
    return rows.filter((store) =>
      [store.nombre, store.descripcion, store.direccion]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [q, storesQuery.data]);

  const selected = stores.find((store) => store.id === selectedId) ?? stores[0] ?? null;
  const mapLat = selected?.lat ?? coords?.lat ?? BARRANQUILLA_CENTER.lat;
  const mapLng = selected?.lng ?? coords?.lng ?? BARRANQUILLA_CENTER.lng;
  const bboxDelta = selected ? 0.004 : 0.02;
  const bbox = `${mapLng - bboxDelta},${mapLat - bboxDelta},${mapLng + bboxDelta},${mapLat + bboxDelta}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat},${mapLng}`;
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Centro de Barranquilla
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mapa de comercios</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Encuentra tiendas activas, compara cercania y abre rutas para llegar.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_180px_130px_auto] lg:w-[760px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar comercio, producto o direccion"
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
                  <SelectTrigger className="h-11">
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

                <div>
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
                    className="h-11"
                    aria-label="Radio en kilometros"
                  />
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
          <div className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-soft)]">
            <iframe
              title="Mapa de comercios QuillacentrO"
              src={mapSrc}
              className="h-[420px] w-full border-0 md:h-[620px]"
              loading="lazy"
            />
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
