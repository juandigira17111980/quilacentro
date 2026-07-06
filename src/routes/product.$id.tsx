import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  PackageCheck,
  ShieldCheck,
  Store as StoreIcon,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/cards/ProductCard";
import { StarRating } from "@/components/cards/StarRating";
import { StoreMiniMap } from "@/components/cards/StoreMiniMap";
import { trackLeadEvent } from "@/lib/leadEvents";
import {
  productoByIdQuery,
  productosByComercioQuery,
  promocionesByComercioQuery,
} from "@/lib/queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Producto — QuillacentrO" }] }),
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(productoByIdQuery(params.id));
    if (!data) throw notFound();
  },
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">No pudimos cargar este producto.</p>
        <p className="mt-1 text-xs text-destructive">{error.message}</p>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Producto no encontrado</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link
            to="/search"
            search={{
              q: "",
              categoria: undefined,
              precioMin: undefined,
              precioMax: undefined,
              conPromo: false,
              disponibles: true,
              tab: "productos",
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a buscar
          </Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: productoData } = useSuspenseQuery(productoByIdQuery(id));
  const producto = productoData!;
  const com = producto.comercios!;
  const imagenes = [producto.imagen_url, ...(producto.imagenes ?? [])].filter(Boolean) as string[];
  const [active, setActive] = useState(0);
  const hasOferta = producto.precio_oferta != null && producto.precio_oferta < producto.precio_base;
  const finalPrice = hasOferta ? producto.precio_oferta! : producto.precio_base;

  const { data: promos = [] } = useQuery(promocionesByComercioQuery(com.id, 3));
  const { data: otrosProductos = [] } = useQuery(
    productosByComercioQuery(com.id, { excludeId: producto.id, limit: 4 }),
  );

  const waMsg = encodeURIComponent(
    `Hola ${com.nombre}, me interesa el producto: ${producto.nombre} (${fmt(finalPrice)}).`,
  );
  const waNumber = (com.whatsapp ?? com.telefono ?? "").replace(/[^\d]/g, "");
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waMsg}` : null;
  const directions =
    com.lat != null && com.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${com.lat},${com.lng}&travelmode=walking`
      : null;
  const pickupText =
    com.recogida_disponible === false
      ? "No disponible por ahora."
      : com.recogida_notas ||
        (com.direccion
          ? "Disponible si confirmas con el comercio."
          : "Confirma el punto de entrega.");
  const deliveryText =
    com.domicilio_disponible === true
      ? com.domicilio_notas || "Coordinalo directo por WhatsApp con la tienda."
      : "No disponible por ahora.";
  const availabilityText =
    com.disponibilidad_notas ||
    (producto.disponible
      ? "Producto marcado como disponible."
      : "Consulta alternativas similares.");
  const trustText =
    com.confianza_notas ||
    `${Number(com.rating_avg ?? 0).toFixed(1)} de 5 con ${com.total_reviews ?? 0} resenas.`;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link
            to="/search"
            search={{
              q: "",
              categoria: undefined,
              precioMin: undefined,
              precioMax: undefined,
              conPromo: false,
              disponibles: true,
              tab: "productos",
            }}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galería */}
          <div>
            <div className="aspect-square overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-soft)]">
              {imagenes[active] ? (
                <img
                  src={imagenes[active]}
                  alt={producto.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imagenes.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info principal */}
          <div className="flex flex-col">
            {producto.marca && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {producto.marca}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">{producto.nombre}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              {hasOferta ? (
                <>
                  <span className="text-4xl font-extrabold text-accent">
                    {fmt(producto.precio_oferta!)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {fmt(producto.precio_base)}
                  </span>
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">OFERTA</Badge>
                </>
              ) : (
                <span className="text-4xl font-extrabold">{fmt(producto.precio_base)}</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {producto.disponible ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <Check className="mr-1 h-3 w-3" /> Disponible
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive"
                >
                  <X className="mr-1 h-3 w-3" /> Agotado
                </Badge>
              )}
              {producto.stock != null && producto.stock > 0 && (
                <span className="text-xs text-muted-foreground">
                  Quedan {producto.stock} unidades
                </span>
              )}
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex flex-wrap gap-2">
              {waHref ? (
                <Button
                  asChild
                  size="lg"
                  className="flex-1 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90"
                >
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      void trackLeadEvent({
                        eventType: "whatsapp_click",
                        comercioId: com.id,
                        productoId: producto.id,
                        channel: "whatsapp",
                        source: "product_detail",
                        metadata: {
                          product_name: producto.nombre,
                          store_slug: com.slug,
                        },
                      })
                    }
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Comprar por WhatsApp
                  </a>
                </Button>
              ) : null}
              {directions && (
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      void trackLeadEvent({
                        eventType: "directions_click",
                        comercioId: com.id,
                        productoId: producto.id,
                        channel: "maps",
                        source: "product_detail",
                        metadata: {
                          product_name: producto.nombre,
                          store_slug: com.slug,
                        },
                      })
                    }
                  >
                    <Navigation className="mr-2 h-4 w-4" /> Como llegar
                  </a>
                </Button>
              )}
              <ConsultaInline producto={producto} />
              <FavoritoButton productoId={producto.id} comercioId={com.id} />
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
              <TrustItem
                icon={<PackageCheck className="h-4 w-4" />}
                title="Recoger en tienda"
                text={pickupText}
              />
              <TrustItem
                icon={<Truck className="h-4 w-4" />}
                title="Domicilio"
                text={deliveryText}
              />
              <TrustItem
                icon={<Check className="h-4 w-4" />}
                title="Disponibilidad"
                text={availabilityText}
              />
              <TrustItem
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Confianza"
                text={trustText}
              />
            </div>

            {producto.descripcion && (
              <>
                <Separator className="my-6" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Descripción
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {producto.descripcion}
                </p>
              </>
            )}

            {producto.tags && producto.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {producto.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {producto.atributos && Object.keys(producto.atributos).length > 0 && (
              <>
                <Separator className="my-6" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Detalles
                </h2>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(producto.atributos).map(([k, v]) => (
                    <div key={k} className="rounded-lg border bg-card px-3 py-2">
                      <dt className="text-xs capitalize text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>

        {/* Comercio + mapa */}
        <section className="mt-12 grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 text-lg font-semibold">Vendido por</h2>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {com.logo_url ? (
                  <img src={com.logo_url} alt={com.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <StoreIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to="/store/$slug"
                  params={{ slug: com.slug }}
                  className="text-lg font-semibold hover:underline"
                >
                  {com.nombre}
                </Link>
                <div className="mt-1">
                  <StarRating value={Number(com.rating_avg ?? 0)} count={com.total_reviews ?? 0} />
                </div>
                {com.direccion && (
                  <p className="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {com.direccion}
                  </p>
                )}
                {com.horarios && Object.keys(com.horarios).length > 0 && (
                  <div className="mt-3 flex items-start gap-1 text-xs text-muted-foreground">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2">{summarizeHorarios(com.horarios)}</span>
                  </div>
                )}
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                  <Link to="/store/$slug" params={{ slug: com.slug }}>
                    Ver tienda completa
                  </Link>
                </Button>
              </div>
            </div>

            {promos.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Promociones vigentes
                </h3>
                <ul className="space-y-2">
                  {promos.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{p.titulo}</span>
                      <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                        {p.tipo === "descuento_pct" && p.valor
                          ? `-${Math.round(p.valor)}%`
                          : p.tipo}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <StoreMiniMap
            lat={com.lat ?? null}
            lng={com.lng ?? null}
            name={com.nombre}
            height={320}
          />
        </section>

        {/* Más productos */}
        {otrosProductos.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold">Más productos de {com.nombre}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {otrosProductos.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function summarizeHorarios(h: Record<string, string>) {
  return Object.entries(h)
    .map(([d, hh]) => `${d}: ${hh}`)
    .join(" · ");
}

function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background text-primary">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}

function ConsultaInline({
  producto,
}: {
  producto: { id: string; nombre: string; comercio_id: string };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(`Hola, ¿tienen disponible "${producto.nombre}"?`);
  const [nombre, setNombre] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: sess } = await supabase.auth.getUser();
    const cliente_id = sess.user?.id ?? null;
    const finalMsg = cliente_id ? mensaje : `[${nombre || "Anónimo"}] ${mensaje}`;
    const { error } = await supabase.from("consultas").insert({
      comercio_id: producto.comercio_id,
      producto_id: producto.id,
      cliente_id,
      mensaje: finalMsg,
      canal: "chat",
      estado: "nuevo",
    });
    setLoading(false);
    if (error) {
      toast.error("No pudimos enviar la consulta", { description: error.message });
      return;
    }
    toast.success("Consulta enviada al comercio");
    void trackLeadEvent({
      eventType: "availability_submit",
      comercioId: producto.comercio_id,
      productoId: producto.id,
      channel: "platform",
      source: "product_detail",
      metadata: { product_name: producto.nombre },
    });
    setOpen(false);
    setMensaje(`Hola, ¿tienen disponible "${producto.nombre}"?`);
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="flex-1 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Phone className="mr-2 h-4 w-4" /> Consultar disponibilidad
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-2 w-full space-y-3 rounded-2xl border bg-muted/40 p-4">
      <h3 className="font-semibold">Consultar al comercio</h3>
      <ClienteOnlyName nombre={nombre} onChange={setNombre} />
      <Textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={3}
        required
        minLength={4}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {loading ? "Enviando…" : "Enviar consulta"}
        </Button>
      </div>
    </form>
  );
}

function ClienteOnlyName({ nombre, onChange }: { nombre: string; onChange: (s: string) => void }) {
  const [needsName, setNeedsName] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setNeedsName(!data.user));
  }, []);
  if (!needsName) return null;
  return (
    <div>
      <Label htmlFor="nombre" className="text-xs">
        Tu nombre
      </Label>
      <Input
        id="nombre"
        value={nombre}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cómo te llamás"
      />
    </div>
  );
}

function FavoritoButton({ productoId, comercioId }: { productoId: string; comercioId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const { data: fav } = useQuery({
    queryKey: ["favorito", productoId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("favoritos")
        .select("id")
        .eq("cliente_id", userId!)
        .eq("producto_id", productoId)
        .maybeSingle();
      return data?.id ?? null;
    },
  });

  const toggle = async () => {
    if (!userId) {
      toast.info("Iniciá sesión para guardar favoritos");
      return;
    }
    if (fav) {
      await supabase.from("favoritos").delete().eq("id", fav);
      toast.success("Quitado de favoritos");
    } else {
      const { error } = await supabase
        .from("favoritos")
        .insert({ cliente_id: userId, producto_id: productoId, comercio_id: comercioId });
      if (error) {
        toast.error("No se pudo guardar", { description: error.message });
        return;
      }
      toast.success("Guardado en favoritos");
    }
    qc.invalidateQueries({ queryKey: ["favorito", productoId, userId] });
  };

  return (
    <Button variant="outline" size="lg" className="rounded-full" onClick={toggle}>
      <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-accent text-accent" : ""}`} />
      {fav ? "Guardado" : "Guardar"}
    </Button>
  );
}
