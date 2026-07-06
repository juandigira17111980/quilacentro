import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  myComercioQuery,
  myPromotionsQuery,
  myProductsQuery,
  type MyPromocion,
} from "@/lib/dashboardQueries";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/promotions")({
  component: PromotionsPage,
});

function estadoPromo(p: MyPromocion): "futura" | "activa" | "expirada" | "inactiva" {
  if (!p.activa) return "inactiva";
  const now = Date.now();
  const ini = new Date(p.fecha_inicio).getTime();
  const fin = new Date(p.fecha_fin).getTime();
  if (now < ini) return "futura";
  if (now > fin) return "expirada";
  return "activa";
}

function PromotionsPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const { data: comercio } = useQuery({ ...myComercioQuery(userId ?? ""), enabled: !!userId });
  const { data: promos = [], isLoading } = useQuery(myPromotionsQuery(comercio?.id));
  const { data: products = [] } = useQuery(myProductsQuery(comercio?.id));

  const [editing, setEditing] = useState<MyPromocion | null>(null);
  const [creating, setCreating] = useState(false);

  if (!comercio) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Primero creá tu comercio en "Mi comercio".
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Promociones</h1>
          <p className="text-sm text-muted-foreground">
            Atraé clientes con descuentos y ofertas especiales.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva promoción
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : promos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No tenés promociones todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {promos.map((p) => {
            const estado = estadoPromo(p);
            return (
              <Card key={p.id} className="overflow-hidden">
                {p.imagen_url && (
                  <div className="aspect-[3/1] bg-muted">
                    <img src={p.imagen_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.tipo}
                        {p.valor != null && ` · ${p.valor}`}
                      </div>
                    </div>
                    <Badge
                      variant={
                        estado === "activa"
                          ? "default"
                          : estado === "futura"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {estado}
                    </Badge>
                  </div>
                  {p.descripcion && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {p.descripcion}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(p.fecha_inicio), "dd/MM/yy")} →{" "}
                    {format(new Date(p.fecha_fin), "dd/MM/yy")}
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("promociones")
                          .delete()
                          .eq("id", p.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Promoción eliminada");
                          qc.invalidateQueries({ queryKey: ["my-promotions"] });
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && userId && (
        <PromoFormDialog
          open
          onOpenChange={(o) => {
            if (!o) {
              setCreating(false);
              setEditing(null);
            }
          }}
          comercioId={comercio.id}
          userId={userId}
          promo={editing}
          products={products}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["my-promotions"] });
          }}
        />
      )}
    </div>
  );
}

function PromoFormDialog({
  open,
  onOpenChange,
  comercioId,
  userId,
  promo,
  products,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  comercioId: string;
  userId: string;
  promo: MyPromocion | null;
  products: { id: string; nombre: string }[];
  onSaved: () => void;
}) {
  type FormP = {
    titulo: string;
    descripcion: string;
    tipo: string;
    valor: string;
    fecha_inicio: Date | undefined;
    fecha_fin: Date | undefined;
    producto_id: string | null;
    imagen_url: string | null;
    activa: boolean;
    destacada: boolean;
  };
  const initial: FormP = useMemo(
    () => ({
      titulo: promo?.titulo ?? "",
      descripcion: promo?.descripcion ?? "",
      tipo: promo?.tipo ?? "descuento_pct",
      valor: promo?.valor != null ? String(promo.valor) : "",
      fecha_inicio: promo ? new Date(promo.fecha_inicio) : new Date(),
      fecha_fin: promo ? new Date(promo.fecha_fin) : new Date(Date.now() + 7 * 86400_000),
      producto_id: promo?.producto_id ?? null,
      imagen_url: promo?.imagen_url ?? null,
      activa: promo?.activa ?? true,
      destacada: promo?.destacada ?? false,
    }),
    [promo],
  );

  const [f, setF] = useState<FormP>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setF(initial), [initial]);
  const set = <K extends keyof FormP>(k: K, v: FormP[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.titulo.trim()) return toast.error("Título requerido");
    if (!f.fecha_inicio || !f.fecha_fin) return toast.error("Fechas requeridas");
    if (f.fecha_fin <= f.fecha_inicio)
      return toast.error("La fecha de fin debe ser posterior a la de inicio");
    setSaving(true);
    try {
      const payload = {
        comercio_id: comercioId,
        titulo: f.titulo.trim(),
        descripcion: f.descripcion || null,
        tipo: f.tipo,
        valor: f.valor ? Number(f.valor) : null,
        fecha_inicio: f.fecha_inicio.toISOString(),
        fecha_fin: f.fecha_fin.toISOString(),
        producto_id: f.producto_id,
        imagen_url: f.imagen_url,
        activa: f.activa,
        destacada: f.destacada,
      };
      if (promo) {
        const { error } = await supabase
          .from("promociones")
          .update(payload as never)
          .eq("id", promo.id);
        if (error) throw error;
        toast.success("Promoción actualizada");
      } else {
        const { error } = await supabase.from("promociones").insert(payload as never);
        if (error) throw error;
        toast.success("Promoción creada");
      }
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const pathPrefix = `${userId}/${promo?.id ?? "draft"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promo ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Título *</Label>
            <Input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={f.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <Select value={f.tipo} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descuento_pct">Descuento %</SelectItem>
                  <SelectItem value="descuento_fijo">Descuento fijo</SelectItem>
                  <SelectItem value="2x1">2x1</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                min="0"
                value={f.valor}
                onChange={(e) => set("valor", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label="Fecha inicio"
              value={f.fecha_inicio}
              onChange={(d) => set("fecha_inicio", d)}
            />
            <DateField
              label="Fecha fin"
              value={f.fecha_fin}
              onChange={(d) => set("fecha_fin", d)}
            />
          </div>
          <div>
            <Label>Producto asociado (opcional)</Label>
            <Select
              value={f.producto_id ?? "_none"}
              onValueChange={(v) => set("producto_id", v === "_none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Ninguno</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ImageUploader
            bucket="promociones"
            pathPrefix={pathPrefix}
            value={f.imagen_url}
            onChange={(u) => set("imagen_url", u)}
            label="Imagen"
            aspect="wide"
          />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.activa} onCheckedChange={(v) => set("activa", v)} />
              Activa
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.destacada} onCheckedChange={(v) => set("destacada", v)} />
              Destacada
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : <span>Elegí fecha</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
