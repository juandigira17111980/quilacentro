import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type OrderItem = { id: string; nombre_producto: string; cantidad: number; total_linea: number };
type StoreOrder = {
  id: string;
  numero: number;
  estado: string;
  modalidad: string;
  contacto_nombre: string;
  contacto_telefono: string;
  notas_cliente: string | null;
  total: number;
  created_at: string;
  items: OrderItem[];
};

async function authenticatedFetch(path: string, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Tu sesión expiró");
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No fue posible completar la acción");
  return body;
}

export const Route = createFileRoute("/dashboard/orders")({ component: OrdersPage });

function OrdersPage() {
  const client = useQueryClient();
  const [commerceId, setCommerceId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: commerce } = await supabase
        .from("comercios")
        .select("id")
        .eq("owner_id", data.user.id)
        .is("deleted_at", null)
        .maybeSingle();
      setCommerceId(commerce?.id ?? null);
    });
  }, []);
  const orders = useQuery({
    queryKey: ["store-orders", commerceId],
    enabled: Boolean(commerceId),
    queryFn: async () =>
      (await authenticatedFetch(`/api/store/orders?comercio_id=${commerceId}`))
        .pedidos as StoreOrder[],
  });

  const update = async (order: StoreOrder, estado: string) => {
    const requiresReason = estado === "rechazado" || estado === "cancelado";
    const motivo = requiresReason
      ? window.prompt("Indica el motivo para el cliente:")?.trim()
      : null;
    if (requiresReason && !motivo) return;
    try {
      await authenticatedFetch(`/api/store/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ estado, motivo }),
      });
      toast.success("Pedido actualizado");
      client.invalidateQueries({ queryKey: ["store-orders", commerceId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar el pedido");
    }
  };

  if (commerceId === null) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Primero crea o selecciona tu comercio.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Solicitudes sin pago que debes confirmar y preparar.
        </p>
      </div>
      {orders.isLoading ? (
        <Skeleton className="h-64" />
      ) : orders.data?.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay pedidos para este comercio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {orders.data?.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Pedido #{order.numero}</span>
                    <Badge variant="outline">{order.estado}</Badge>
                    <span className="text-sm text-muted-foreground">{order.modalidad}</span>
                  </div>
                  <p className="text-sm">
                    {order.contacto_nombre} · {order.contacto_telefono}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.items
                      .map((item) => `${item.cantidad} × ${item.nombre_producto}`)
                      .join(" · ")}
                  </p>
                  {order.notas_cliente && (
                    <p className="text-sm text-muted-foreground">Nota: {order.notas_cliente}</p>
                  )}
                  <p className="font-semibold">${Number(order.total).toLocaleString("es-CO")}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {nextStates(order).map((state) => (
                    <Button
                      key={state}
                      size="sm"
                      variant={
                        state === "rechazado" || state === "cancelado" ? "outline" : "default"
                      }
                      onClick={() => update(order, state)}
                    >
                      {stateLabel(state)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function nextStates(order: StoreOrder) {
  if (order.estado === "solicitado") return ["aceptado", "rechazado"];
  if (order.estado === "aceptado") return ["preparando", "cancelado"];
  if (order.estado === "preparando") return ["listo", "cancelado"];
  if (order.estado === "listo")
    return order.modalidad === "domicilio" ? ["en_camino", "entregado"] : ["entregado"];
  if (order.estado === "en_camino") return ["entregado"];
  return [];
}

function stateLabel(state: string) {
  return (
    (
      {
        aceptado: "Aceptar",
        rechazado: "Rechazar",
        preparando: "Preparar",
        listo: "Listo",
        en_camino: "En camino",
        entregado: "Entregar",
        cancelado: "Cancelar",
      } as Record<string, string>
    )[state] ?? state
  );
}
