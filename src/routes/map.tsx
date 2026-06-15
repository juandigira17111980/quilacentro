import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Mapa — QuillacentrO" },
      { name: "description", content: "Mapa interactivo de comercios del Centro de Barranquilla." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      icon={<MapPin className="h-7 w-7" />}
      badge="Mapa"
      title="Mapa de comercios"
      description="Vista de mapa completa con clusters, filtros por categoría y popups de comercios. Próximamente."
    />
  ),
});
