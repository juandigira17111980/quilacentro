import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [{ title: "Producto — QuillacentrO" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  return (
    <PagePlaceholder
      icon={<Tag className="h-7 w-7" />}
      badge={`Producto #${id}`}
      title="Detalle del producto"
      description="Galería, descripción, comercio que lo vende, promociones activas y ubicación en el mapa. Próximamente."
    />
  );
}
