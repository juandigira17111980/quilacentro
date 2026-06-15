import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  myComercioQuery,
  myProductsQuery,
  myPlanQuery,
  categoriasAllQuery,
  type MyProducto,
} from "@/lib/dashboardQueries";
import { ImageUploader, MultiImageUploader } from "@/components/dashboard/ImageUploader";
import { TagsInput } from "@/components/dashboard/TagsInput";
import { AttributesEditor } from "@/components/dashboard/AttributesEditor";
import { slugify } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: comercio } = useQuery({
    ...myComercioQuery(userId ?? ""),
    enabled: !!userId,
  });
  const { data: productos = [], isLoading } = useQuery(myProductsQuery(comercio?.id));
  const { data: plan } = useQuery(myPlanQuery(comercio?.plan_id));
  const { data: categorias = [] } = useQuery(categoriasAllQuery);

  const [editing, setEditing] = useState<MyProducto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MyProducto | null>(null);

  const maxProductos = plan?.max_productos ?? 10;
  const atLimit = productos.length >= maxProductos;

  if (!comercio) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        Primero creá tu comercio en "Mi comercio".
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {productos.length} / {maxProductos} publicados {plan?.nombre && `(plan ${plan.nombre})`}
          </p>
        </div>
        <Button
          onClick={() => {
            if (atLimit) {
              toast.error(`Alcanzaste el límite del plan (${maxProductos}). Actualizá tu plan para publicar más.`);
              return;
            }
            setCreating(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />Nuevo producto
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : productos.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Todavía no publicaste productos.
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]" />
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                        {p.imagen_url && <img src={p.imagen_url} alt="" className="h-full w-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground">{p.marca ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.precio_oferta ? (
                        <>
                          <div className="text-xs text-muted-foreground line-through">${Number(p.precio_base).toLocaleString()}</div>
                          <div className="font-semibold">${Number(p.precio_oferta).toLocaleString()}</div>
                        </>
                      ) : (
                        <>${Number(p.precio_base).toLocaleString()}</>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.stock ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={p.disponible ? "default" : "outline"}>{p.disponible ? "Disponible" : "Agotado"}</Badge>
                        {p.destacado && <Badge variant="secondary">Destacado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {(creating || editing) && userId && (
        <ProductFormDialog
          open
          onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
          comercioId={comercio.id}
          userId={userId}
          producto={editing}
          categorias={categorias}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["my-products"] });
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.nombre}" se eliminará de tu catálogo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                const { error } = await supabase
                  .from("productos")
                  .update({ deleted_at: new Date().toISOString() } as never)
                  .eq("id", deleting.id);
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success("Producto eliminado");
                  qc.invalidateQueries({ queryKey: ["my-products"] });
                }
                setDeleting(null);
              }}
            >Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const productSchema = z.object({
  nombre: z.string().trim().min(2).max(160),
  precio_base: z.number().min(0),
  precio_oferta: z.number().min(0).nullable().optional(),
});

function ProductFormDialog({
  open,
  onOpenChange,
  comercioId,
  userId,
  producto,
  categorias,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  comercioId: string;
  userId: string;
  producto: MyProducto | null;
  categorias: { id: number; nombre: string }[];
  onSaved: () => void;
}) {
  type FormP = {
    nombre: string;
    descripcion: string;
    categoria_id: number | null;
    marca: string;
    sku: string;
    precio_base: string;
    precio_oferta: string;
    stock: string;
    disponible: boolean;
    destacado: boolean;
    imagen_url: string | null;
    imagenes: string[];
    tags: string[];
    atributos: Record<string, string>;
  };
  const initial: FormP = useMemo(() => ({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    categoria_id: producto?.categoria_id ?? null,
    marca: producto?.marca ?? "",
    sku: producto?.sku ?? "",
    precio_base: producto ? String(producto.precio_base) : "",
    precio_oferta: producto?.precio_oferta != null ? String(producto.precio_oferta) : "",
    stock: producto?.stock != null ? String(producto.stock) : "",
    disponible: producto?.disponible ?? true,
    destacado: producto?.destacado ?? false,
    imagen_url: producto?.imagen_url ?? null,
    imagenes: producto?.imagenes ?? [],
    tags: producto?.tags ?? [],
    atributos: producto?.atributos ?? {},
  }), [producto]);

  const [f, setF] = useState<FormP>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setF(initial); }, [initial]);

  const set = <K extends keyof FormP>(k: K, v: FormP[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const parsed = productSchema.safeParse({
      nombre: f.nombre,
      precio_base: Number(f.precio_base),
      precio_oferta: f.precio_oferta ? Number(f.precio_oferta) : null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        comercio_id: comercioId,
        nombre: f.nombre.trim(),
        descripcion: f.descripcion || null,
        categoria_id: f.categoria_id,
        marca: f.marca || null,
        sku: f.sku || null,
        precio_base: Number(f.precio_base),
        precio_oferta: f.precio_oferta ? Number(f.precio_oferta) : null,
        stock: f.stock ? Number(f.stock) : null,
        disponible: f.disponible,
        destacado: f.destacado,
        imagen_url: f.imagen_url,
        imagenes: f.imagenes,
        tags: f.tags.length ? f.tags : null,
        atributos: f.atributos,
      };
      if (producto) {
        const { error } = await supabase.from("productos").update(payload as never).eq("id", producto.id);
        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const slug = `${slugify(f.nombre)}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase.from("productos").insert({ ...payload, slug } as never);
        if (error) throw error;
        toast.success("Producto creado");
      }
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const pathPrefix = `${userId}/${producto?.id ?? "draft"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={160} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Categoría</Label>
              <Select value={f.categoria_id?.toString() ?? ""} onValueChange={(v) => set("categoria_id", v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={f.marca} onChange={(e) => set("marca", e.target.value)} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={f.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Precio base *</Label>
              <Input type="number" min="0" value={f.precio_base} onChange={(e) => set("precio_base", e.target.value)} />
            </div>
            <div>
              <Label>Precio oferta</Label>
              <Input type="number" min="0" value={f.precio_oferta} onChange={(e) => set("precio_oferta", e.target.value)} />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.disponible} onCheckedChange={(v) => set("disponible", v)} />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.destacado} onCheckedChange={(v) => set("destacado", v)} />
              Destacado
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <ImageUploader
              bucket="productos"
              pathPrefix={pathPrefix}
              value={f.imagen_url}
              onChange={(u) => set("imagen_url", u)}
              label="Imagen principal"
            />
            <MultiImageUploader
              bucket="productos"
              pathPrefix={pathPrefix}
              values={f.imagenes}
              onChange={(arr) => set("imagenes", arr)}
              max={4}
            />
          </div>
          <div>
            <Label className="mb-1 block">Etiquetas</Label>
            <TagsInput value={f.tags} onChange={(t) => set("tags", t)} />
          </div>
          <div>
            <Label className="mb-1 block">Atributos</Label>
            <AttributesEditor value={f.atributos} onChange={(a) => set("atributos", a)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
