import { useEffect, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppRole } from "@/lib/auth";

export type ManagedUser = {
  id: string;
  full_name: string;
  phone: string | null;
  role: AppRole;
  account_status: "activo" | "suspendido";
};

type UserDetail = ManagedUser & { email: string | null };
type AdminFetch = <T>(path: string, init?: RequestInit) => Promise<T>;

const roleLabels: Record<AppRole, string> = {
  cliente: "Cliente · consulta y compra",
  comercio: "Comercio · gestiona su tienda",
  admin: "Administrador · revisa la operación",
  super_admin: "Superadministrador · gestiona cuentas y seguridad",
};

export function UserManagementDialog({
  user,
  currentRole,
  currentUserId,
  open,
  onOpenChange,
  adminFetch,
  onChanged,
}: {
  user: ManagedUser | null;
  currentRole: AppRole | null;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminFetch: AdminFetch;
  onChanged: () => Promise<void>;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [role, setRole] = useState<AppRole>("cliente");
  const [profileReason, setProfileReason] = useState("");
  const [emailReason, setEmailReason] = useState("");
  const [roleReason, setRoleReason] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [passwordReason, setPasswordReason] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!open || !userId) {
      setTemporaryPassword(null);
      setDetail(null);
      return;
    }
    let active = true;
    setLoading(true);
    adminFetch<{ usuario: UserDetail }>(`/api/admin/users/${userId}`)
      .then(({ usuario }) => {
        if (!active) return;
        setDetail(usuario);
        setName(usuario.full_name);
        setPhone(usuario.phone ?? "");
        setEmail(usuario.email ?? "");
        setEmailConfirm("");
        setRole(usuario.role);
        setProfileReason("");
        setEmailReason("");
        setRoleReason("");
        setStatusReason("");
        setPasswordReason("");
      })
      .catch((error: unknown) => {
        if (active)
          toast.error(error instanceof Error ? error.message : "No se pudo abrir la cuenta");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adminFetch, open, userId]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la operación");
    } finally {
      setBusy(false);
    }
  };

  const isSuperAdmin = currentRole === "super_admin";
  const isSelf = detail?.id === currentUserId;
  const validReason = (value: string) => value.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.full_name ?? user?.full_name ?? "Cuenta de usuario"}</DialogTitle>
        </DialogHeader>
        {loading || !detail ? (
          <p className="py-8 text-sm text-muted-foreground">Cargando cuenta…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-5 gap-y-1 border-b pb-4 text-sm text-muted-foreground">
              <span>{detail.email ?? "Sin correo"}</span>
              <span>{roleLabels[detail.role]}</span>
              <span>
                {detail.account_status === "activo" ? "Cuenta activa" : "Cuenta suspendida"}
              </span>
            </div>
            {!isSuperAdmin ? (
              <p className="py-4 text-sm text-muted-foreground">
                Solo un superadministrador puede modificar cuentas y permisos.
              </p>
            ) : (
              <Tabs defaultValue="profile" className="mt-2">
                <TabsList className="h-auto w-full flex-wrap justify-start">
                  <TabsTrigger value="profile">Datos</TabsTrigger>
                  <TabsTrigger value="access">Correo y clave</TabsTrigger>
                  <TabsTrigger value="permissions">Rol y estado</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="managed-name">Nombre completo</Label>
                    <Input
                      id="managed-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managed-phone">Teléfono</Label>
                    <Input
                      id="managed-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                  <ReasonInput
                    id="profile-reason"
                    value={profileReason}
                    onChange={setProfileReason}
                  />
                  <Button
                    disabled={busy || name.trim().length < 2 || !validReason(profileReason)}
                    onClick={() =>
                      void run(async () => {
                        await adminFetch(`/api/admin/users/${detail.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            full_name: name.trim(),
                            phone: phone.trim() || null,
                            reason: profileReason.trim(),
                          }),
                        });
                        setDetail({
                          ...detail,
                          full_name: name.trim(),
                          phone: phone.trim() || null,
                        });
                        setProfileReason("");
                      }, "Datos actualizados")
                    }
                  >
                    Guardar datos
                  </Button>
                </TabsContent>

                <TabsContent value="access" className="space-y-6 py-4">
                  <div className="space-y-3 border-b pb-5">
                    <h3 className="text-sm font-semibold">Correo de acceso</h3>
                    <div className="space-y-2">
                      <Label htmlFor="managed-email">Nuevo correo</Label>
                      <Input
                        id="managed-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managed-email-confirm">Confirmar nuevo correo</Label>
                      <Input
                        id="managed-email-confirm"
                        type="email"
                        value={emailConfirm}
                        onChange={(event) => setEmailConfirm(event.target.value)}
                      />
                    </div>
                    <ReasonInput id="email-reason" value={emailReason} onChange={setEmailReason} />
                    <Button
                      variant="outline"
                      disabled={
                        busy ||
                        !validReason(emailReason) ||
                        !emailConfirm ||
                        email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase() ||
                        email.trim().toLowerCase() === detail.email?.toLowerCase()
                      }
                      onClick={() =>
                        void run(async () => {
                          const result = await adminFetch<{
                            email: string;
                            audit_warning?: boolean;
                          }>(`/api/admin/users/${detail.id}/email`, {
                            method: "PUT",
                            body: JSON.stringify({
                              email: email.trim(),
                              reason: emailReason.trim(),
                            }),
                          });
                          setDetail({ ...detail, email: result.email });
                          setEmailConfirm("");
                          setEmailReason("");
                          if (result.audit_warning)
                            toast.error("Correo cambiado, pero revisa la bitácora");
                        }, "Correo actualizado")
                      }
                    >
                      Actualizar correo
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Clave de acceso</h3>
                    <p className="text-sm text-muted-foreground">
                      La clave anterior dejará de funcionar. Copia la nueva antes de cerrar esta
                      ventana y compártela de forma segura con el usuario.
                    </p>
                    <ReasonInput
                      id="password-reason"
                      value={passwordReason}
                      onChange={setPasswordReason}
                    />
                    <Button
                      disabled={
                        busy || detail.account_status !== "activo" || !validReason(passwordReason)
                      }
                      onClick={() =>
                        void run(async () => {
                          const result = await adminFetch<{
                            temporary_password: string;
                            audit_warning?: boolean;
                          }>(`/api/admin/users/${detail.id}/password`, {
                            method: "POST",
                            body: JSON.stringify({ reason: passwordReason.trim() }),
                          });
                          setTemporaryPassword(result.temporary_password);
                          setPasswordReason("");
                          if (result.audit_warning)
                            toast.error("Clave cambiada, pero revisa la bitácora");
                        }, "Nueva clave generada")
                      }
                    >
                      <KeyRound className="mr-2 h-4 w-4" /> Generar nueva clave
                    </Button>
                    {temporaryPassword && (
                      <div className="flex flex-wrap gap-2" role="status">
                        <Input
                          aria-label="Nueva clave de acceso"
                          readOnly
                          value={temporaryPassword}
                          className="min-w-0 flex-1 font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={() => void navigator.clipboard.writeText(temporaryPassword)}
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6 py-4">
                  <div className="space-y-3 border-b pb-5">
                    <h3 className="text-sm font-semibold">Rol en Mercanta</h3>
                    <select
                      aria-label="Rol del usuario"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={role}
                      disabled={isSelf || busy}
                      onChange={(event) => setRole(event.target.value as AppRole)}
                    >
                      {(Object.keys(roleLabels) as AppRole[]).map((value) => (
                        <option key={value} value={value}>
                          {roleLabels[value]}
                        </option>
                      ))}
                    </select>
                    {isSelf && (
                      <p className="text-xs text-muted-foreground">
                        No puedes cambiar tu propio rol.
                      </p>
                    )}
                    <ReasonInput id="role-reason" value={roleReason} onChange={setRoleReason} />
                    <Button
                      disabled={busy || isSelf || role === detail.role || !validReason(roleReason)}
                      onClick={() =>
                        void run(async () => {
                          await adminFetch("/api/admin/users", {
                            method: "PUT",
                            body: JSON.stringify({
                              id: detail.id,
                              role,
                              reason: roleReason.trim(),
                            }),
                          });
                          setDetail({ ...detail, role });
                          setRoleReason("");
                        }, "Rol actualizado")
                      }
                    >
                      Guardar rol
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Estado de la cuenta</h3>
                    <p className="text-sm text-muted-foreground">
                      {detail.account_status === "activo"
                        ? "La cuenta puede ingresar."
                        : "La cuenta no puede ingresar hasta reactivarla."}
                    </p>
                    <ReasonInput
                      id="status-reason"
                      value={statusReason}
                      onChange={setStatusReason}
                    />
                    <Button
                      variant={detail.account_status === "activo" ? "destructive" : "default"}
                      disabled={busy || isSelf || !validReason(statusReason)}
                      onClick={() =>
                        void run(async () => {
                          const next = detail.account_status === "activo" ? "suspendido" : "activo";
                          await adminFetch(`/api/admin/users/${detail.id}/status`, {
                            method: "PUT",
                            body: JSON.stringify({
                              account_status: next,
                              reason: statusReason.trim(),
                            }),
                          });
                          setDetail({ ...detail, account_status: next });
                          setStatusReason("");
                        }, "Estado actualizado")
                      }
                    >
                      {detail.account_status === "activo" ? "Suspender cuenta" : "Reactivar cuenta"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Motivo del cambio</Label>
      <Input
        id={id}
        value={value}
        maxLength={500}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escribe al menos 10 caracteres"
      />
    </div>
  );
}
