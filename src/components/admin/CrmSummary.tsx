import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Row = {
  comercio_id: string;
  total: number;
  nuevo: number;
  contactado: number;
  cotizado: number;
  ganado: number;
  perdido: number;
};

export function CrmSummary({ storeNames }: { storeNames: Map<string, string> }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Tu sesión expiró");
      const response = await fetch("/api/admin/crm-summary", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No fue posible cargar el resumen");
      setRows(body.comercios);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar el resumen");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="space-y-3 border bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Oportunidades por comercio</h2>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>
      {loading ? (
        <p className="text-sm">Cargando...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay oportunidades identificables.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Comercio</th>
                <th>Total</th>
                <th>Nuevas</th>
                <th>Contactadas</th>
                <th>Cotizadas</th>
                <th>Ganadas</th>
                <th>Perdidas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.comercio_id} className="border-b">
                  <td className="py-2">{storeNames.get(row.comercio_id) ?? "Comercio"}</td>
                  <td>{row.total}</td>
                  <td>{row.nuevo}</td>
                  <td>{row.contactado}</td>
                  <td>{row.cotizado}</td>
                  <td>{row.ganado}</td>
                  <td>{row.perdido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
