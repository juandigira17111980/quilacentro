import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store as StoreIcon,
  Package,
  Tag,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: NavItem[] = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/profile", label: "Mi comercio", icon: StoreIcon },
  { to: "/dashboard/products", label: "Productos", icon: Package },
  { to: "/dashboard/promotions", label: "Promociones", icon: Tag },
  { to: "/dashboard/queries", label: "Consultas", icon: MessageSquare },
];

export function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 lg:flex-col lg:overflow-visible">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? path === to : path === to || path.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
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
        <Outlet />
      </main>
    </div>
  );
}
