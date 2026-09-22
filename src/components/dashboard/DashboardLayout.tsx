import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store as StoreIcon,
  Package,
  Tag,
  MessageSquare,
  ClipboardList,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStoreProvider } from "@/components/dashboard/DashboardStoreContext";
import { useDashboardStore } from "@/components/dashboard/dashboard-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: NavItem[] = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/profile", label: "Mi comercio", icon: StoreIcon },
  { to: "/dashboard/products", label: "Productos", icon: Package },
  { to: "/dashboard/promotions", label: "Promociones", icon: Tag },
  { to: "/dashboard/queries", label: "Consultas", icon: MessageSquare },
  { to: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
];

export function DashboardLayout() {
  return (
    <DashboardStoreProvider>
      <DashboardLayoutContent />
    </DashboardStoreProvider>
  );
}

function DashboardLayoutContent() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { comercios, comercio, loading, error, selectComercio, retry } = useDashboardStore();

  return (
    <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 lg:flex-col lg:overflow-visible">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="hidden h-px bg-border lg:block" />
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? path === to : path === to || path.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to as never}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        {comercios.length > 1 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <label htmlFor="dashboard-comercio" className="text-sm font-medium">
              Comercio
            </label>
            <select
              id="dashboard-comercio"
              className="h-10 min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
              value={comercio?.id ?? ""}
              onChange={(event) => selectComercio(event.target.value)}
            >
              {comercios.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div role="alert" className="space-y-3 py-8">
            <p>No pudimos cargar tus comercios: {error}</p>
            <Button variant="outline" onClick={retry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <Outlet key={comercio?.id ?? "sin-comercio"} />
        )}
      </main>
    </div>
  );
}
