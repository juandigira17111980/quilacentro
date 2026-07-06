import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Camera,
  Loader2,
  MapPin,
  PackageCheck,
  Save,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { myComercioQuery, categoriasAllQuery, type MyComercio } from "@/lib/dashboardQueries";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { HoursEditor, type HoursMap } from "@/components/dashboard/HoursEditor";
import { slugify } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

const BCN_CENTER = { lat: 10.9685, lng: -74.7813 };

const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  descripcion: z.string().max(2000).optional().nullable(),
  categoria_id: z.number().nullable().optional(),
  direccion: z.string().trim().max(255).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email("Email inválido").or(z.literal("")).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  recogida_disponible: z.boolean(),
  recogida_notas: z.string().max(240).optional().nullable(),
  domicilio_disponible: z.boolean(),
  domicilio_notas: z.string().max(240).optional().nullable(),
  disponibilidad_notas: z.string().max(240).optional().nullable(),
  confianza_notas: z.string().max(240).optional().nullable(),
});

type FormState = {
  nombre: string;
  descripcion: string;
  categoria_id: number | null;
  direccion: string;
  telefono: string;
  whatsapp: string;
  email: string;
  lat: number;
  lng: number;
  logo_url: string | null;
  banner_url: string | null;
  horarios: HoursMap;
  recogida_disponible: boolean;
  recogida_notas: string;
  domicilio_disponible: boolean;
  domicilio_notas: string;
  disponibilidad_notas: string;
  confianza_notas: string;
};

const emptyForm = (): FormState => ({
  nombre: "",
  descripcion: "",
  categoria_id: null,
  direccion: "",
  telefono: "",
  whatsapp: "",
  email: "",
  lat: BCN_CENTER.lat,
  lng: BCN_CENTER.lng,
  logo_url: null,
  banner_url: null,
  horarios: {},
  recogida_disponible: true,
  recogida_notas: "",
  domicilio_disponible: false,
  domicilio_notas: "",
  disponibilidad_notas: "",
  confianza_notas: "",
});

function ProfilePage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: comercio, isLoading } = useQuery({
    ...myComercioQuery(userId ?? ""),
    enabled: !!userId,
  });
  const { data: categorias = [] } = useQuery(categoriasAllQuery);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (comercio) {
      setForm({
        nombre: comercio.nombre,
        descripcion: comercio.descripcion ?? "",
        categoria_id: comercio.categoria_id,
        direccion: comercio.direccion ?? "",
        telefono: comercio.telefono ?? "",
        whatsapp: comercio.whatsapp ?? "",
        email: comercio.email ?? "",
        lat: Number(comercio.lat ?? BCN_CENTER.lat),
        lng: Number(comercio.lng ?? BCN_CENTER.lng),
        logo_url: comercio.logo_url,
        banner_url: comercio.banner_url,
        horarios: (comercio.horarios as HoursMap | null) ?? {},
        recogida_disponible: comercio.recogida_disponible ?? true,
        recogida_notas: comercio.recogida_notas ?? "",
        domicilio_disponible: comercio.domicilio_disponible ?? false,
        domicilio_notas: comercio.domicilio_notas ?? "",
        disponibilidad_notas: comercio.disponibilidad_notas ?? "",
        confianza_notas: comercio.confianza_notas ?? "",
      });
    }
  }, [comercio]);

  if (isLoading || !userId) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const isNew = !comercio;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocalización no disponible");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude);
        set("lng", pos.coords.longitude);
        toast.success("Ubicación capturada");
      },
      () => toast.error("No se pudo obtener tu ubicación"),
    );
  };

  const save = async () => {
    const parsed = profileSchema.safeParse({
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      categoria_id: form.categoria_id,
      direccion: form.direccion || null,
      telefono: form.telefono || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      lat: form.lat,
      lng: form.lng,
      recogida_disponible: form.recogida_disponible,
      recogida_notas: form.recogida_notas || null,
      domicilio_disponible: form.domicilio_disponible,
      domicilio_notas: form.domicilio_notas || null,
      disponibilidad_notas: form.disponibilidad_notas || null,
      confianza_notas: form.confianza_notas || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<MyComercio> & { owner_id?: string; slug?: string } = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        categoria_id: form.categoria_id,
        direccion: form.direccion || null,
        telefono: form.telefono || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        lat: form.lat,
        lng: form.lng,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        horarios: form.horarios,
        recogida_disponible: form.recogida_disponible,
        recogida_notas: form.recogida_notas || null,
        domicilio_disponible: form.domicilio_disponible,
        domicilio_notas: form.domicilio_notas || null,
        disponibilidad_notas: form.disponibilidad_notas || null,
        confianza_notas: form.confianza_notas || null,
      };
      if (isNew) {
        const slug = `${slugify(form.nombre)}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase.from("comercios").insert({
          ...payload,
          slug,
          owner_id: userId,
        } as never);
        if (error) throw error;
        toast.success("Comercio creado. Pendiente de aprobación.");
      } else {
        const { error } = await supabase
          .from("comercios")
          .update(payload as never)
          .eq("id", comercio.id);
        if (error) throw error;
        toast.success("Cambios guardados");
      }
      await qc.invalidateQueries({ queryKey: ["my-comercio"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  // -------- Wizard for new comercio --------
  if (isNew) {
    const next = () => setStep((s) => Math.min(4, s + 1));
    const prev = () => setStep((s) => Math.max(1, s - 1));
    const canNext1 = form.nombre.trim().length >= 2;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creá tu comercio</CardTitle>
          <CardDescription>Paso {step} de 4</CardDescription>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && <Step1Basic form={form} set={set} categorias={categorias} />}
          {step === 2 && <Step2Location form={form} set={set} useMyLocation={useMyLocation} />}
          {step === 3 && <Step3Contact form={form} set={set} />}
          {step === 4 && <Step4Operations form={form} set={set} />}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={prev} disabled={step === 1}>
              Atrás
            </Button>
            {step < 4 ? (
              <Button onClick={next} disabled={step === 1 && !canNext1}>
                Continuar
              </Button>
            ) : (
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Crear comercio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------- Edit existing --------
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Perfil del comercio</h1>
          <p className="text-sm text-muted-foreground">
            Mantené tu información actualizada para que los clientes te encuentren.
          </p>
        </div>
        <Badge variant={comercio.estado === "activo" ? "default" : "outline"}>
          {comercio.estado}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step1Basic form={form} set={set} categorias={categorias} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imágenes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <ImageUploader
            bucket="comercios"
            pathPrefix={`${userId}/logo`}
            value={form.logo_url}
            onChange={(u) => set("logo_url", u)}
            label="Logo"
          />
          <div className="min-w-[280px] flex-1">
            <ImageUploader
              bucket="comercios"
              pathPrefix={`${userId}/banner`}
              value={form.banner_url}
              onChange={(u) => set("banner_url", u)}
              label="Banner"
              aspect="wide"
            />
          </div>
        </CardContent>
      </Card>

      <Tour360Card
        comercioId={comercio.id}
        userId={userId}
        tourUrl={comercio.tour_360_url}
        onChange={() => qc.invalidateQueries({ queryKey: ["my-comercio"] })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <Step2Location form={form} set={set} useMyLocation={useMyLocation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto y horarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step3Contact form={form} set={set} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operacion comercial</CardTitle>
          <CardDescription>
            Define como atiendes recogidas, domicilios y mensajes de confianza visibles al cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Step4Operations form={form} set={set} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Step1Basic({
  form,
  set,
  categorias,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  categorias: { id: number; nombre: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label>Nombre del negocio *</Label>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="md:col-span-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Contale a los clientes qué vendés y qué te hace especial."
        />
      </div>
      <div>
        <Label>Categoría principal</Label>
        <Select
          value={form.categoria_id?.toString() ?? ""}
          onValueChange={(v) => set("categoria_id", v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Elegí una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step2Location({
  form,
  set,
  useMyLocation,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  useMyLocation: () => void;
}) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${form.lng - 0.003},${form.lat - 0.002},${form.lng + 0.003},${form.lat + 0.002}&layer=mapnik&marker=${form.lat},${form.lng}`;
  return (
    <div className="space-y-4">
      <div>
        <Label>Dirección</Label>
        <Input
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
          placeholder="Calle 35 #44-12, Centro"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label>Latitud</Label>
          <Input
            type="number"
            step="0.0000001"
            value={form.lat}
            onChange={(e) => set("lat", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Longitud</Label>
          <Input
            type="number"
            step="0.0000001"
            value={form.lng}
            onChange={(e) => set("lng", Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={useMyLocation}>
            <MapPin className="mr-2 h-4 w-4" />
            Mi ubicación
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <iframe title="Mapa" src={mapUrl} className="h-64 w-full" loading="lazy" />
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: ajustá lat/lng o tocá "Mi ubicación" si estás en el local.
      </p>
    </div>
  );
}

function Step3Contact({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Teléfono</Label>
          <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="573001234567"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Horarios</Label>
        <HoursEditor value={form.horarios} onChange={(h) => set("horarios", h)} />
      </div>
    </div>
  );
}

function Step4Operations({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <OperationToggle
          icon={<PackageCheck className="h-4 w-4" />}
          title="Recoger en tienda"
          description="Muestra que el cliente puede reclamar el producto en el local."
          checked={form.recogida_disponible}
          onCheckedChange={(checked) => set("recogida_disponible", checked)}
        />
        <OperationToggle
          icon={<Truck className="h-4 w-4" />}
          title="Domicilio"
          description="Muestra que el comercio puede coordinar envio o mensajeria."
          checked={form.domicilio_disponible}
          onCheckedChange={(checked) => set("domicilio_disponible", checked)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Nota de recogida</Label>
          <Input
            value={form.recogida_notas}
            onChange={(e) => set("recogida_notas", e.target.value)}
            maxLength={240}
            placeholder="Ej: Recoge en mostrador despues de confirmar."
          />
        </div>
        <div>
          <Label>Nota de domicilio</Label>
          <Input
            value={form.domicilio_notas}
            onChange={(e) => set("domicilio_notas", e.target.value)}
            maxLength={240}
            placeholder="Ej: Domicilio coordinado por WhatsApp."
          />
        </div>
        <div>
          <Label>Mensaje de disponibilidad</Label>
          <Input
            value={form.disponibilidad_notas}
            onChange={(e) => set("disponibilidad_notas", e.target.value)}
            maxLength={240}
            placeholder="Ej: Disponibilidad sujeta a confirmacion."
          />
        </div>
        <div>
          <Label>Mensaje de confianza</Label>
          <Input
            value={form.confianza_notas}
            onChange={(e) => set("confianza_notas", e.target.value)}
            maxLength={240}
            placeholder="Ej: Local verificado en el Centro de Barranquilla."
          />
        </div>
      </div>
    </div>
  );
}

function OperationToggle({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background text-primary">
          {icon}
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

const DEMO_TOUR_URL = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=4096&q=80";

function Tour360Card({
  comercioId,
  userId,
  tourUrl,
  onChange,
}: {
  comercioId: string;
  userId: string;
  tourUrl: string | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const update = async (url: string | null) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("comercios")
        .update({ tour_360_url: url } as never)
        .eq("id", comercioId);
      if (error) throw error;
      toast.success(url ? "Tour 360° activado" : "Tour 360° eliminado");
      onChange();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" /> Tour Virtual 360°
            </CardTitle>
            <CardDescription>
              Permite que tus clientes recorran tu local sin salir de casa.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            Plan Pro o Premium
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tourUrl ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="aspect-[2/1] w-64 overflow-hidden rounded-lg border bg-muted">
              <img src={tourUrl} alt="Tour 360°" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Tour activo y visible en tu perfil público.
              </p>
              <div className="flex gap-2">
                <ImageUploader
                  bucket="comercios"
                  pathPrefix={`${userId}/tour360`}
                  value={null}
                  onChange={(u) => u && update(u)}
                  label="Cambiar imagen"
                  aspect="wide"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => update(null)} disabled={busy}>
                Eliminar tour
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <p className="max-w-md text-sm text-muted-foreground">
                Sube una foto panorámica de tu local (relación 2:1 o mayor) para activar el tour
                virtual.
              </p>
              <div className="w-full max-w-sm">
                <ImageUploader
                  bucket="comercios"
                  pathPrefix={`${userId}/tour360`}
                  value={null}
                  onChange={(u) => u && update(u)}
                  label="Subir imagen panorámica"
                  aspect="wide"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> o{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => update(DEMO_TOUR_URL)}
                disabled={busy}
              >
                <Sparkles className="mr-2 h-4 w-4" /> Activar con imagen demo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
