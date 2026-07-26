import { Link } from "@tanstack/react-router";
import {
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Gem,
  Dumbbell,
  ToyBrick,
  NotebookPen,
  Wrench,
  UtensilsCrossed,
  Pill,
  Briefcase,
  Tag,
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

const colorPalette = [
  "bg-primary",
  "bg-brand-teal",
  "bg-brand-coral",
  "bg-[#6E3C91]",
  "bg-[#2F706C]",
  "bg-[#8E531D]",
];

export function CategoryShowcase({ categorias }: { categorias: Categoria[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-6">
      {categorias.map((c, i) => {
        const Icon = iconMap[c.slug] ?? Tag;
        const color = colorPalette[i % colorPalette.length];
        return (
          <Link
            key={c.id}
            to="/search"
            search={{
              q: "",
              categoria: c.id,
              precioMin: undefined,
              precioMax: undefined,
              conPromo: false,
              disponibles: true,
              tab: "productos",
            }}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
            className={`group flex min-w-[7rem] shrink-0 animate-in fade-in slide-in-from-bottom-3 flex-col items-center justify-center gap-2 border border-white/20 ${color} p-5 text-white shadow-[var(--shadow-soft)] duration-300 transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] md:min-w-0`}
          >
            <Icon className="h-8 w-8 text-white drop-shadow" />
            <span className="line-clamp-2 text-center text-xs font-semibold leading-tight">
              {c.nombre}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
