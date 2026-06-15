import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";
import { requireRole } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await requireRole(["admin", "super_admin"], location.href);
  },
  head: () => ({
    meta: [{ title: "Admin — QuillacentrO" }],
  }),
  component: () => (
    <PagePlaceholder
      icon={<ShieldCheck className="h-7 w-7" />}
      badge="Administración"
      title="Panel de administración"
      description="KPIs globales, gestión de comercios, usuarios, categorías y reportes. Próximamente."
    />
  ),
});
