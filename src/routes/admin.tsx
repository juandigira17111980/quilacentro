import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";

export const Route = createFileRoute("/admin")({
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
