import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";

export const Route = createFileRoute("/store/$slug")({
  head: () => ({
    meta: [{ title: "Comercio — QuillacentrO" }],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  return (
    <PagePlaceholder
      icon={<Store className="h-7 w-7" />}
      badge={`Comercio: ${slug}`}
      title="Perfil del comercio"
      description="Catálogo, calificaciones, ubicación en el mapa y botones de contacto directo. Próximamente."
    />
  );
}
