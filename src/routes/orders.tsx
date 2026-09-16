import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/site/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ClientOrder = {
  id: string;
  numero: number;
  estado: string;
  modalidad: string;
  total: number;
  created_at: string;
  comercio: { nombre: string; slug: string; logo_url: string | null } | null;
  items: { id: string; cantidad: number; nombre_producto: string }[];
};

async function clientRequest(path: string, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Inicia sesión para ver tus pedidos");
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No fue posible completar la solicitud");
  return body;
}

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const client = useQueryClient();
  const orders = useQuery({
    queryKey: ["client-orders"],
    queryFn: async () => (await clientRequest("/api/client/orders")).pedidos as ClientOrder[],
  });
  const cancel = async (order: ClientOrder) => {
    const motivo = window.prompt("Indica el motivo de cancelación:")?.trim();
    if (!motivo) return;
    try {
      await clientRequest(`/api/client/orders/${order.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ motivo }),
      });
      toast.success("Pedido cancelado");
      client.invalidateQueries({ queryKey: ["client-orders"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cancelar el pedido");
    }
  };

  return (
    <AppShell>
      <main className="container mx-auto min-h-[60vh] px-4 py-8 md:py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mis pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sigue las solicitudes enviadas a los comercios.
          </p>
        </div>
        {orders.isLoading ? (
          <Skeleton className="h-48" />
        ) : orders.isError ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {orders.error instanceof Error
                  ? orders.error.message
                  : "No pudimos cargar tus pedidos."}
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
            </CardContent>
          </Card>
        ) : orders.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no tienes solicitudes. Explora productos para crear tu primer pedido.
              </p>
              <Button asChild className="mt-4">
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
                  Explorar productos
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {orders.data?.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Pedido #{order.numero}</span>
                      <Badge variant="outline">{order.estado}</Badge>
                    </div>
                    <p className="mt-1 text-sm">
                      {order.comercio?.nombre ?? "Comercio Mercanta"} · {order.modalidad}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.items
                        .map((item) => `${item.cantidad} × ${item.nombre_producto}`)
                        .join(" · ")}
                    </p>
                    <p className="mt-2 font-semibold">
                      ${Number(order.total).toLocaleString("es-CO")}
                    </p>
                  </div>
                  {order.estado === "solicitado" && (
                    <Button variant="outline" onClick={() => cancel(order)}>
                      Cancelar solicitud
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
