import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { requireRole, type AppRole } from "@/lib/auth";

type DashboardData = {
  comercios: { total: number; activos: number; pendientes: number };
  usuarios: { total: number; nuevos_30d: number };
  productos: number;
  consultas_nuevas: number;
};
type PlatformUser = {
  id: string;
  full_name: string;
  phone: string | null;
  role: AppRole;
  account_status: "activo" | "suspendido";
};
type PlatformStore = {
  id: string;
  nombre: string;
  slug: string;
  estado: "pendiente" | "activo" | "suspendido" | "inactivo";
  profiles?: { full_name: string | null } | null;
};
type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  reason: string | null;
  created_at: string;
};
type AdminData = {
  dashboard: DashboardData | null;
  users: PlatformUser[];
  stores: PlatformStore[];
  events: AuditEvent[];
};

const initialData: AdminData = { dashboard: null, users: [], stores: [], events: [] };

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await requireRole(["admin", "super_admin"], location.href);
  },
  head: () => ({ meta: [{ title: "Administración — Mercanta" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [data, setData] = useState<AdminData>(initialData);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const adminFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Tu sesión expiró");
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "No fue posible completar la operación");
    return body as T;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, users, stores, events, identity] = await Promise.all([
        adminFetch<{ dashboard: DashboardData }>("/api/admin/dashboard"),
        adminFetch<{ usuarios: PlatformUser[] }>("/api/admin/users"),
        adminFetch<{ comercios: PlatformStore[] }>("/api/admin/stores"),
        adminFetch<{ eventos: AuditEvent[] }>("/api/admin/audit-events?limit=30"),
        supabase.rpc("get_current_identity"),
      ]);
      setData({
        dashboard: summary.dashboard,
        users: users.usuarios,
        stores: stores.comercios,
        events: events.eventos,
      });
      setRole((identity.data?.[0]?.role as AppRole | undefined) ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No fue posible cargar la administración",
      );
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const requireReason = (action: string) => {
    const reason = window.prompt(`Motivo para ${action} (mínimo 10 caracteres):`);
    if (!reason || reason.trim().length < 10) {
      toast.error("Debes indicar un motivo de al menos 10 caracteres");
      return null;
    }
    return reason.trim();
  };

  const changeUserRole = async (user: PlatformUser, nextRole: AppRole) => {
    if (nextRole === user.role) return;
    const reason = requireReason(`cambiar el rol de ${user.full_name}`);
    if (!reason) return;
    try {
      await adminFetch("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ id: user.id, role: nextRole, reason }),
      });
      toast.success("Rol actualizado y registrado en la bitácora");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el rol");
    }
  };

  const changeUserStatus = async (user: PlatformUser, accountStatus: "activo" | "suspendido") => {
    const action =
      accountStatus === "suspendido"
        ? `suspender a ${user.full_name}`
        : `reactivar a ${user.full_name}`;
    const reason = requireReason(action);
    if (!reason) return;
    try {
      await adminFetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ account_status: accountStatus, reason }),
      });
      toast.success("Estado de cuenta actualizado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la cuenta");
    }
  };

  const requestRecovery = async (user: PlatformUser) => {
    const reason = requireReason(`solicitar recuperación para ${user.full_name}`);
    if (!reason) return;
    try {
      await adminFetch(`/api/admin/users/${user.id}/recovery`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      toast.success("Solicitud de recuperación enviada y auditada");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo solicitar la recuperación");
    }
  };

  const changeStoreStatus = async (store: PlatformStore, estado: PlatformStore["estado"]) => {
    if (estado === store.estado) return;
    const needsReason = estado === "suspendido" || estado === "inactivo";
    const reason = needsReason ? requireReason(`cambiar el estado de ${store.nombre}`) : null;
    if (needsReason && !reason) return;
    try {
      await adminFetch(`/api/admin/stores/${store.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ estado, reason }),
      });
      toast.success("Estado del comercio actualizado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el comercio");
    }
  };

  const normalized = query.trim().toLocaleLowerCase();
  const users = data.users.filter((user) =>
    user.full_name.toLocaleLowerCase().includes(normalized),
  );
  const stores = data.stores.filter((store) =>
    store.nombre.toLocaleLowerCase().includes(normalized),
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Operación Mercanta</p>
            <h1 className="mt-1 text-3xl font-bold">Administración de plataforma</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Control de cuentas, comercios y acciones sensibles.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
        <section
          className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Indicadores operativos"
        >
          <Metric
            label="Comercios activos"
            value={data.dashboard?.comercios.activos ?? "-"}
            icon={Building2}
          />
          <Metric
            label="Pendientes de revisión"
            value={data.dashboard?.comercios.pendientes ?? "-"}
            icon={ShieldCheck}
          />
          <Metric
            label="Usuarios registrados"
            value={data.dashboard?.usuarios.total ?? "-"}
            icon={Users}
          />
          <Metric
            label="Consultas nuevas"
            value={data.dashboard?.consultas_nuevas ?? "-"}
            icon={ShieldCheck}
          />
        </section>
        <div className="mt-7 max-w-md">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar usuario o comercio"
          />
        </div>
        <Tabs defaultValue="stores" className="mt-5">
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            <TabsTrigger value="stores">Comercios ({stores.length})</TabsTrigger>
            <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
            <TabsTrigger value="audit">Bitácora ({data.events.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="stores" className="mt-4">
            <section className="border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comercio</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <p className="font-medium">{store.nombre}</p>
                        <p className="text-xs text-muted-foreground">/{store.slug}</p>
                      </TableCell>
                      <TableCell>{store.profiles?.full_name ?? "Sin asignar"}</TableCell>
                      <TableCell>
                        <StatusBadge value={store.estado} />
                      </TableCell>
                      <TableCell className="text-right">
                        <select
                          aria-label={`Estado de ${store.nombre}`}
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={store.estado}
                          onChange={(event) =>
                            void changeStoreStatus(
                              store,
                              event.target.value as PlatformStore["estado"],
                            )
                          }
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="activo">Activo</option>
                          <option value="suspendido">Suspendido</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && stores.length === 0 && (
                    <EmptyRow colSpan={4} text="No hay comercios que coincidan." />
                  )}
                </TableBody>
              </Table>
            </section>
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <section className="border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Operación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.phone ?? "Sin teléfono"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {role === "super_admin" ? (
                          <select
                            aria-label={`Rol de ${user.full_name}`}
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={user.role}
                            onChange={(event) =>
                              void changeUserRole(user, event.target.value as AppRole)
                            }
                          >
                            <option value="cliente">Cliente</option>
                            <option value="comercio">Comercio</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super admin</option>
                          </select>
                        ) : (
                          <StatusBadge value={user.role} />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={user.account_status} />
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {role === "super_admin" && user.account_status === "activo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void changeUserStatus(user, "suspendido")}
                          >
                            Suspender
                          </Button>
                        )}
                        {role === "super_admin" && user.account_status === "suspendido" && (
                          <Button size="sm" onClick={() => void changeUserStatus(user, "activo")}>
                            Reactivar
                          </Button>
                        )}
                        {role === "super_admin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void requestRecovery(user)}
                          >
                            Recuperación
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && users.length === 0 && (
                    <EmptyRow colSpan={4} text="No hay usuarios que coincidan." />
                  )}
                </TableBody>
              </Table>
            </section>
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <section className="border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{new Date(event.created_at).toLocaleString("es-CO")}</TableCell>
                      <TableCell className="font-medium">{event.action}</TableCell>
                      <TableCell>{event.resource_type}</TableCell>
                      <TableCell className="max-w-xs truncate">{event.reason ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && data.events.length === 0 && (
                    <EmptyRow colSpan={4} text="Aún no hay acciones auditadas." />
                  )}
                </TableBody>
              </Table>
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
}) {
  return (
    <div className="border bg-background p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    activo: "Activo",
    suspendido: "Suspendido",
    pendiente: "Pendiente",
    inactivo: "Inactivo",
    cliente: "Cliente",
    comercio: "Comercio",
    admin: "Admin",
    super_admin: "Super admin",
  };
  return <Badge variant="outline">{labels[value] ?? value}</Badge>;
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}
