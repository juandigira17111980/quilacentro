import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Buscar — QuillacentrO" },
      { name: "description", content: "Buscá productos en los comercios físicos del Centro de Barranquilla." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      icon={<Search className="h-7 w-7" />}
      badge="Búsqueda"
      title="Buscar productos y comercios"
      description="Acá aparecerán los resultados con filtros, mapa lateral y lista de comercios. Próximamente."
    />
  ),
});
