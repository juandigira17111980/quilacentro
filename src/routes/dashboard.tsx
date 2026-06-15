import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";
import { requireRole } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await requireRole(["comercio", "admin", "super_admin"], location.href);
  },
  head: () => ({
    meta: [{ title: "Panel Comercio — QuillacentrO" }],
  }),
  component: () => (
    <PagePlaceholder
      icon={<LayoutDashboard className="h-7 w-7" />}
      badge="Panel de Comercio"
      title="Gestioná tu comercio"
      description="Estadísticas, catálogo de productos, promociones y mensajes de clientes. Próximamente."
    />
  ),
});
