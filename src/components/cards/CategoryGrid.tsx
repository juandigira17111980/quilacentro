import { Link } from "@tanstack/react-router";
import {
  Shirt, Smartphone, Sofa, Sparkles, Gem, Dumbbell,
  ToyBrick, NotebookPen, Wrench, UtensilsCrossed, Pill, Briefcase, Tag,
  type LucideIcon,
} from "lucide-react";
import type { Categoria } from "@/lib/queries";

const iconMap: Record<string, LucideIcon> = {
  "moda-calzado": Shirt,
  electronica: Smartphone,
  "hogar-decoracion": Sofa,
  belleza: Sparkles,
  joyeria: Gem,
  deportes: Dumbbell,
  jugueteria: ToyBrick,
  papeleria: NotebookPen,
  ferreteria: Wrench,
  alimentos: UtensilsCrossed,
  salud: Pill,
  servicios: Briefcase,
};

export function CategoryGrid({ categorias }: { categorias: Categoria[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {categorias.map((c) => {
        const Icon = iconMap[c.slug] ?? Tag;
        return (
          <Link
            key={c.id}
            to="/search"
            search={{ q: "", categoria: c.id, precioMin: undefined, precioMax: undefined, conPromo: false, disponibles: true, tab: "productos" }}
            className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-accent group-hover:text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-xs font-medium leading-tight">{c.nombre}</span>
          </Link>
        );
      })}
    </div>
  );
}
