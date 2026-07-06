import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Package,
  Eye,
  MessageSquare,
  Star,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import {
  myComercioQuery,
  myProductsQuery,
  myQueriesQuery,
  myStoreStatsQuery,
} from "@/lib/dashboardQueries";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function useUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
  }, []);
  return id;
}

function DashboardIndex() {
  const userId = useUserId();
  const { data: comercio, isLoading: cLoading } = useQuery({
    ...myComercioQuery(userId ?? ""),
    enabled: !!userId,
  });
  const { data: productos = [] } = useQuery(myProductsQuery(comercio?.id));
  const { data: consultas = [] } = useQuery(myQueriesQuery(comercio?.id));
  const { data: stats } = useQuery(myStoreStatsQuery(comercio?.id));

  if (cLoading || !userId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!comercio) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="text-xl font-semibold">Aún no tenés un comercio</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Creá tu perfil de comercio para empezar a publicar productos y promociones.
          </p>
          <Button asChild>
            <Link to="/dashboard/profile">Crear mi comercio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nuevas = consultas.filter((c) => c.estado === "nuevo").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {comercio.nombre}</h1>
        <p className="text-sm text-muted-foreground">Resumen de la actividad de tu comercio.</p>
      </div>

      {comercio.estado === "pendiente" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tu comercio está pendiente de aprobación</AlertTitle>
          <AlertDescription>
            Un administrador lo revisará pronto. Mientras tanto, podés terminar de completar tu
            perfil y catálogo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Productos" value={productos.length} icon={Package} />
        <KpiCard
          label="Vistas totales"
          value={stats?.vistas_totales ?? 0}
          icon={Eye}
          hint="Catálogo"
        />
        <KpiCard
          label="Consultas nuevas"
          value={stats?.consultas_nuevas ?? nuevas}
          icon={MessageSquare}
        />
        <KpiCard
          label="Rating"
          value={(stats?.rating_promedio ?? comercio.rating_avg ?? 0).toFixed(1)}
          icon={Star}
          hint={`${stats?.total_reviews ?? comercio.total_reviews ?? 0} reseñas`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interés comercial — últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MetricTile
              label="WhatsApp"
              value={stats?.eventos_30d.whatsapp_clicks ?? 0}
              icon={MessageCircle}
            />
            <MetricTile
              label="Cómo llegar"
              value={stats?.eventos_30d.directions_clicks ?? 0}
              icon={Navigation}
            />
            <MetricTile
              label="Disponibilidad"
              value={stats?.eventos_30d.availability_submits ?? 0}
              icon={CheckCircle2}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-accent" /> Productos con más interés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.productos_interes ?? []).length === 0 && (
              <div className="py-5 text-center text-sm text-muted-foreground">
                Aún no hay eventos medibles de productos.
              </div>
            )}
            {(stats?.productos_interes ?? []).map((p, index) => (
              <div key={p.producto_id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {index + 1}. {p.nombre}
                  </div>
                  <div className="text-xs text-muted-foreground">Señales de compra</div>
                </div>
                <Badge variant="secondary">{p.eventos}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vistas por día — últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <ViewsChart seed={comercio.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimas consultas</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/queries">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y">
          {consultas.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aún no recibiste consultas.
            </div>
          )}
          {consultas.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {c.profiles?.full_name ?? "Cliente"}
                  {c.productos?.nombre && (
                    <span className="text-muted-foreground"> · {c.productos.nombre}</span>
                  )}
                </div>
                <div className="line-clamp-1 text-xs text-muted-foreground">{c.mensaje}</div>
              </div>
              <Badge
                variant={
                  c.estado === "nuevo"
                    ? "default"
                    : c.estado === "respondido"
                      ? "secondary"
                      : "outline"
                }
                className="shrink-0"
              >
                {c.estado}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
