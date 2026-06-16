import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Camera, Clock, MapPin, MessageCircle, Navigation, Phone, Search as SearchIcon, Sparkles, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/cards/ProductCard";
import { Tour360Viewer } from "@/components/store/Tour360Viewer";

import { InteractiveStars, StarRating } from "@/components/cards/StarRating";
import { StoreMiniMap } from "@/components/cards/StoreMiniMap";
import {
  comercioBySlugQuery,
  productosByComercioQuery,
  promocionesByComercioQuery,
  resenasByComercioQuery,
  myReviewQuery,
  categoriasQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/store/$slug")({
  head: () => ({ meta: [{ title: "Comercio — QuillacentrO" }] }),
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(comercioBySlugQuery(params.slug));
    if (!data) throw notFound();
  },
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Comercio no encontrado</h1>
      </div>
    </AppShell>
  ),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  const { data: com } = useSuspenseQuery(comercioBySlugQuery(slug));
  if (!com) return null;

  const waNumber = (com.whatsapp ?? com.telefono ?? "").replace(/[^\d]/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola ${com.nombre}, quisiera más información.`)}`
    : null;
  const directions = com.lat != null && com.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${com.lat},${com.lng}&travelmode=walking`
    : null;

  return (
    <AppShell>
      {/* HEADER */}
      <header className="relative">
        <div className="h-44 w-full overflow-hidden bg-primary md:h-60">
          {com.banner_url ? (
            <img src={com.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60" />
          )}
        </div>
        <div className="container mx-auto px-4">
          <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-[var(--shadow-elevated)] md:h-28 md:w-28">
                {com.logo_url ? (
                  <img src={com.logo_url} alt={com.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground"><StoreIcon className="h-8 w-8" /></div>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold md:text-3xl">{com.nombre}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {com.categorias?.nombre && (
                    <Badge variant="secondary">{com.categorias.nombre}</Badge>
                  )}
                  <StarRating value={Number(com.rating_avg ?? 0)} showNumber count={com.total_reviews ?? 0} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {waHref && (
                <Button asChild className="rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90">
                  <a href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</a>
                </Button>
              )}
              {com.telefono && (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={`tel:${com.telefono}`}><Phone className="mr-2 h-4 w-4" /> Llamar</a>
                </Button>
              )}
              {directions && (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={directions} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" /> Cómo llegar</a>
                </Button>
              )}
            </div>
          </div>

          {com.descripcion && (
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{com.descripcion}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {com.direccion && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {com.direccion}</span>
            )}
            {com.horarios && Object.keys(com.horarios).length > 0 && (
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {summarizeHorarios(com.horarios)}</span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <main>
          <Tabs defaultValue="productos">
            <TabsList>
              <TabsTrigger value="productos">Productos</TabsTrigger>
              <TabsTrigger value="promociones">Promociones</TabsTrigger>
              <TabsTrigger value="resenas">Reseñas</TabsTrigger>
            </TabsList>
            <TabsContent value="productos" className="mt-5"><ProductosTab comercioId={com.id} /></TabsContent>
            <TabsContent value="promociones" className="mt-5"><PromosTab comercioId={com.id} /></TabsContent>
            <TabsContent value="resenas" className="mt-5"><ResenasTab comercioId={com.id} /></TabsContent>
          </Tabs>
        </main>

        <aside className="space-y-6">
          <StoreMiniMap lat={com.lat ?? null} lng={com.lng ?? null} name={com.nombre} height={280} />
        </aside>
      </div>
    </AppShell>
  );
}

function summarizeHorarios(h: Record<string, string>) {
  return Object.entries(h).map(([d, hh]) => `${d}: ${hh}`).join(" · ");
}

function ProductosTab({ comercioId }: { comercioId: string }) {
  const { data: productos = [], isLoading } = useQuery(productosByComercioQuery(comercioId));
  const { data: categorias = [] } = useQuery(categoriasQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const catsConProd = useMemo(() => {
    const ids = new Set(productos.map((p) => p.categoria_id).filter(Boolean));
    return categorias.filter((c) => ids.has(c.id));
  }, [productos, categorias]);

  const filtered = productos.filter((p) => {
    if (cat !== "all" && String(p.categoria_id) !== cat) return false;
    if (q.trim() && !p.nombre.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-card px-4 shadow-[var(--shadow-soft)]">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en esta tienda" className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" />
        </div>
        {catsConProd.length > 0 && (
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-48 rounded-full"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {catsConProd.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando productos…</p>
      ) : filtered.length === 0 ? (
        <EmptyBox text="No hay productos para mostrar." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}

function PromosTab({ comercioId }: { comercioId: string }) {
  const { data = [], isLoading } = useQuery(promocionesByComercioQuery(comercioId));
  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando promociones…</p>;
  if (data.length === 0) return <EmptyBox text="Este comercio no tiene promociones vigentes." />;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {data.map((p) => (
        <li key={p.id} className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{p.titulo}</h3>
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">
              {p.tipo === "descuento_pct" && p.valor ? `-${Math.round(p.valor)}%` : p.tipo}
            </Badge>
          </div>
          {p.descripcion && <p className="mt-1 text-sm text-muted-foreground">{p.descripcion}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            Vence el {new Date(p.fecha_fin).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ResenasTab({ comercioId }: { comercioId: string }) {
  const qc = useQueryClient();
  const { data: resenas = [], isLoading } = useQuery(resenasByComercioQuery(comercioId));
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUserId(u?.id ?? null);
      if (u) {
        const { data: p } = await supabase.rpc("get_my_profile");
        const row = Array.isArray(p) ? (p[0] as { role?: string } | undefined) : null;
        setRole(row?.role ?? null);
      }
    });
  }, []);

  const { data: myReview = null } = useQuery(myReviewQuery(comercioId, userId));

  const distribution = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    resenas.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1]++; });
    return d;
  }, [resenas]);
  const total = resenas.length;
  const avg = total ? resenas.reduce((s, r) => s + r.rating, 0) / total : 0;


  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="text-center">
          <p className="text-4xl font-extrabold">{avg.toFixed(1)}</p>
          <StarRating value={avg} size="md" />
          <p className="mt-1 text-xs text-muted-foreground">{total} reseña{total === 1 ? "" : "s"}</p>
        </div>
        <Separator className="my-4" />
        <ul className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const c = distribution[stars - 1];
            const pct = total ? (c / total) * 100 : 0;
            return (
              <li key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right">{stars}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground">{c}</span>
              </li>
            );
          })}
        </ul>
      </aside>

      <div>
        {userId && role === "cliente" && (
          <ReviewForm comercioId={comercioId} userId={userId} existing={myReview} onSaved={() => qc.invalidateQueries({ queryKey: ["resenas", comercioId] })} />
        )}
        {!userId && (
          <div className="mb-6 rounded-2xl border bg-muted/40 p-4 text-sm">
            <Link to="/auth" className="font-medium text-accent hover:underline">Iniciá sesión</Link> para dejar tu reseña.
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando reseñas…</p>
        ) : resenas.length === 0 ? (
          <EmptyBox text="Todavía no hay reseñas. Sé el primero en escribir una." />
        ) : (
          <ul className="space-y-4">
            {resenas.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.profiles?.full_name ?? "Cliente"}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="mt-1"><StarRating value={r.rating} /></div>
                {r.comentario && <p className="mt-2 text-sm leading-relaxed">{r.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReviewForm({
  comercioId, userId, existing, onSaved,
}: {
  comercioId: string;
  userId: string;
  existing: { id: string; rating: number; comentario: string | null } | null;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comentario, setComentario] = useState(existing?.comentario ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRating(existing?.rating ?? 5);
    setComentario(existing?.comentario ?? "");
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setLoading(true);
    const payload = { cliente_id: userId, comercio_id: comercioId, rating, comentario: comentario.trim() || null };
    const { error } = await supabase.from("calificaciones").upsert(payload, { onConflict: "cliente_id,comercio_id" });
    setLoading(false);
    if (error) {
      toast.error("No pudimos guardar tu reseña", { description: error.message });
      return;
    }
    toast.success(existing ? "Reseña actualizada" : "¡Gracias por tu reseña!");
    onSaved();
  };

  return (
    <form onSubmit={submit} className="mb-6 space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
      <h3 className="font-semibold">{existing ? "Editar mi reseña" : "Dejar una reseña"}</h3>
      <InteractiveStars value={rating} onChange={setRating} />
      <Textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Contá tu experiencia con este comercio (opcional)"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? "Guardando…" : existing ? "Actualizar reseña" : "Publicar reseña"}
        </Button>
      </div>
    </form>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
