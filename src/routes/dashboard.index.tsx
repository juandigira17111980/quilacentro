import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Package, Eye, MessageSquare, Star, AlertTriangle, ArrowRight } from "lucide-react";
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

  if (cLoading || !userId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
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
            Un administrador lo revisará pronto. Mientras tanto, podés terminar de completar tu perfil y catálogo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Productos" value={productos.length} icon={Package} />
        <KpiCard label="Vistas (30 días)" value={Math.round(800 + productos.length * 30)} icon={Eye} hint="Estimado" />
        <KpiCard label="Consultas nuevas" value={nuevas} icon={MessageSquare} />
        <KpiCard label="Rating" value={(comercio.rating_avg ?? 0).toFixed(1)} icon={Star} hint={`${comercio.total_reviews ?? 0} reseñas`} />
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
            <Link to="/dashboard/queries">Ver todas <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y">
          {consultas.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Aún no recibiste consultas.</div>
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
              <Badge variant={c.estado === "nuevo" ? "default" : c.estado === "respondido" ? "secondary" : "outline"} className="shrink-0">
                {c.estado}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
