import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDashboardStore } from "@/components/dashboard/dashboard-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

type LeadStatus = "nuevo" | "contactado" | "cotizado" | "ganado" | "perdido";
type Lead = {
  id: string;
  comercio_id: string;
  consulta_id: string | null;
  consulta?: { mensaje: string; canal: string } | null;
  contacto_nombre: string;
  contacto_telefono: string | null;
  asunto: string;
  origen: string;
  estado: LeadStatus;
  responsable_id: string | null;
  proxima_accion_at: string | null;
  created_at: string;
};
type TeamMember = { id: string; full_name: string | null };
type Activity = { id: string; tipo: string; detalle: string; created_at: string };

async function storeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Tu sesión expiró");
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No se pudo completar la acción");
  return body as T;
}

const statuses: LeadStatus[] = ["nuevo", "contactado", "cotizado", "ganado", "perdido"];

export const Route = createFileRoute("/dashboard/leads")({ component: LeadsPage });

function LeadsPage() {
  const { comercio } = useDashboardStore();
  const cache = useQueryClient();
  const [filter, setFilter] = useState<LeadStatus | "todos">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");

  const list = useQuery({
    queryKey: ["store-leads", comercio?.id],
    enabled: Boolean(comercio?.id),
    queryFn: () =>
      storeFetch<{ leads: Lead[]; equipo: TeamMember[] }>(
        `/api/store/leads?comercio_id=${encodeURIComponent(comercio!.id)}`,
      ),
  });
  const detail = useQuery({
    queryKey: ["store-lead", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () =>
      storeFetch<{ lead: Lead; actividades: Activity[] }>(`/api/store/leads/${selectedId}`),
  });

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: ["store-leads", comercio?.id] });
    if (selectedId) void cache.invalidateQueries({ queryKey: ["store-lead", selectedId] });
  };
  const update = async (changes: Record<string, unknown>) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await storeFetch(`/api/store/leads/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setNote("");
      refresh();
      toast.success("Seguimiento actualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comercio) return;
    setBusy(true);
    try {
      await storeFetch("/api/store/leads", {
        method: "POST",
        body: JSON.stringify({
          comercio_id: comercio.id,
          contacto_nombre: name,
          contacto_telefono: phone || null,
          asunto: subject,
        }),
      });
      setName("");
      setPhone("");
      setSubject("");
      setCreating(false);
      refresh();
      toast.success("Oportunidad creada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  };

  if (!comercio)
    return (
      <p className="py-10 text-sm text-muted-foreground">
        Selecciona un comercio para ver sus oportunidades.
      </p>
    );
  const leads = (list.data?.leads ?? []).filter(
    (lead) => filter === "todos" || lead.estado === filter,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento comercial de {comercio.nombre}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Actualizar"
            aria-label="Actualizar oportunidades"
            onClick={() => void list.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por etapa">
        {(["todos", ...statuses] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {status === "todos" ? "Todas" : status[0].toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>
      {list.isLoading ? (
        <p className="py-8 text-sm text-muted-foreground">Cargando oportunidades...</p>
      ) : list.isError ? (
        <p role="alert" className="py-8 text-sm text-destructive">
          No pudimos cargar las oportunidades.{" "}
          <Button variant="outline" onClick={() => void list.refetch()}>
            Reintentar
          </Button>
        </p>
      ) : leads.length === 0 ? (
        <p className="border py-10 text-center text-sm text-muted-foreground">
          No hay oportunidades en esta etapa.
        </p>
      ) : (
        <div className="divide-y border bg-background">
          {leads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => setSelectedId(lead.id)}
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">{lead.contacto_nombre}</strong>
                <span className="block truncate text-sm text-muted-foreground">{lead.asunto}</span>
              </span>
              <span className="text-right text-xs text-muted-foreground">
                {lead.estado}
                <br />
                {new Date(lead.created_at).toLocaleDateString("es-CO")}
              </span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nueva oportunidad</SheetTitle>
          </SheetHeader>
          <form onSubmit={(event) => void create(event)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="lead-name">Nombre</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Teléfono (opcional)</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                minLength={7}
                maxLength={30}
              />
            </div>
            <div>
              <Label htmlFor="lead-subject">Interés</Label>
              <Input
                id="lead-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
                minLength={3}
                maxLength={200}
              />
            </div>
            <Button type="submit" disabled={busy}>
              Guardar oportunidad
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detail.data?.lead.contacto_nombre ?? "Oportunidad"}</SheetTitle>
          </SheetHeader>
          {detail.isLoading ? (
            <p className="mt-6 text-sm">Cargando...</p>
          ) : detail.isError ? (
            <p role="alert" className="mt-6 text-sm text-destructive">
              No se pudo cargar el seguimiento.
            </p>
          ) : (
            detail.data && (
              <div className="mt-6 space-y-5">
                <p className="text-sm">{detail.data.lead.asunto}</p>
                {detail.data.lead.consulta && (
                  <p className="whitespace-pre-wrap border-l-2 border-primary pl-3 text-sm text-muted-foreground">
                    {detail.data.lead.consulta.mensaje}
                  </p>
                )}
                {detail.data.lead.consulta_id && (
                  <p className="text-xs text-muted-foreground">Origen: consulta de la plataforma</p>
                )}
                {detail.data.lead.contacto_telefono && (
                  <a
                    className="text-sm text-primary underline"
                    href={`tel:${detail.data.lead.contacto_telefono}`}
                  >
                    {detail.data.lead.contacto_telefono}
                  </a>
                )}
                <div>
                  <Label htmlFor="lead-stage">Etapa</Label>
                  <select
                    id="lead-stage"
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={detail.data.lead.estado}
                    disabled={busy}
                    onChange={(event) => void update({ estado: event.target.value })}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-owner">Responsable</Label>
                  <select
                    id="lead-owner"
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={detail.data.lead.responsable_id ?? ""}
                    disabled={busy}
                    onChange={(event) =>
                      void update({ responsable_id: event.target.value || null })
                    }
                  >
                    <option value="">Sin asignar</option>
                    {(list.data?.equipo ?? []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name ?? "Miembro"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-followup">Próximo seguimiento</Label>
                  <Input
                    id="lead-followup"
                    type="datetime-local"
                    defaultValue={detail.data.lead.proxima_accion_at?.slice(0, 16) ?? ""}
                    onBlur={(event) => {
                      if (event.target.value)
                        void update({
                          proxima_accion_at: new Date(event.target.value).toISOString(),
                        });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="lead-note">Nota de seguimiento</Label>
                  <textarea
                    id="lead-note"
                    className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                  />
                  <Button
                    className="mt-2"
                    disabled={busy || note.trim().length < 2}
                    onClick={() => void update({ nota: note.trim() })}
                  >
                    Guardar nota
                  </Button>
                </div>
                <section>
                  <h2 className="mb-2 text-sm font-semibold">Historial</h2>
                  <div className="divide-y border">
                    {detail.data.actividades.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Sin actividad todavía.</p>
                    ) : (
                      detail.data.actividades.map((activity) => (
                        <div key={activity.id} className="p-3 text-sm">
                          <p>{activity.detalle}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString("es-CO")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
