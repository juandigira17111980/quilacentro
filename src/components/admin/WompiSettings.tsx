import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Environment = "test" | "prod";
type Status = {
  ambientes: { ambiente: Environment; updated_at: string }[];
  servidor_listo: boolean;
  pagos_activos: boolean;
};
const empty = { publicKey: "", privateKey: "", eventsSecret: "", integritySecret: "" };

async function configRequest<T>(method: "GET" | "PUT", payload?: object): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Tu sesión expiró");
  const response = await fetch("/api/admin/wompi-config", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    ...(payload && { body: JSON.stringify(payload) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "No se pudo consultar la configuración");
  return result as T;
}

export function WompiSettings() {
  const [environment, setEnvironment] = useState<Environment>("test");
  const [status, setStatus] = useState<Status | null>(null);
  const [values, setValues] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setStatus(await configRequest<Status>("GET"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar Wompi");
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await configRequest("PUT", { ambiente: environment, ...values });
      setValues(empty);
      await load();
      toast.success("Llaves guardadas de forma cifrada. Los pagos siguen desactivados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar las llaves");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-2xl space-y-5 border bg-background p-5">
      <div>
        <h2 className="text-lg font-semibold">Wompi</h2>
        <p className="text-sm text-muted-foreground">
          Preparación de credenciales. Esta pantalla no activa cobros ni cambia el checkout.
        </p>
      </div>
      {!status?.servidor_listo && (
        <p
          role="alert"
          className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-foreground"
        >
          Antes de guardar llaves, configura PAYMENT_CONFIG_KEY en el servidor de la aplicación.
        </p>
      )}
      <div className="flex gap-2" aria-label="Ambiente Wompi">
        <Button
          variant={environment === "test" ? "default" : "outline"}
          onClick={() => {
            setEnvironment("test");
            setValues(empty);
          }}
        >
          Pruebas
        </Button>
        <Button
          variant={environment === "prod" ? "default" : "outline"}
          onClick={() => {
            setEnvironment("prod");
            setValues(empty);
          }}
        >
          Producción
        </Button>
      </div>
      <p className="text-sm">
        {status?.ambientes.some((item) => item.ambiente === environment)
          ? "Credenciales guardadas; por seguridad no se muestran. Guarda las cuatro nuevamente para reemplazarlas."
          : "Sin credenciales para este ambiente."}
      </p>
      <form onSubmit={(event) => void save(event)} autoComplete="off" className="space-y-4">
        {(
          [
            ["publicKey", "Llave pública"],
            ["privateKey", "Llave privada"],
            ["eventsSecret", "Secreto de eventos"],
            ["integritySecret", "Secreto de integridad"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={`wompi-${key}`}>{label}</Label>
            <Input
              id={`wompi-${key}`}
              type="password"
              value={values[key]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [key]: event.target.value }))
              }
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </div>
        ))}
        <Button type="submit" disabled={busy || !status?.servidor_listo}>
          Guardar llaves
        </Button>
      </form>
    </section>
  );
}
