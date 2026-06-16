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

const colorPalette = [
  "from-rose-500 to-pink-600",
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-cyan-600",
  "from-yellow-500 to-amber-600",
  "from-violet-500 to-indigo-600",
  "from-red-500 to-rose-600",
  "from-lime-500 to-green-600",
  "from-cyan-500 to-blue-600",
  "from-orange-500 to-red-600",
];

export function CategoryShowcase({ categorias }: { categorias: Categoria[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-6">
      {categorias.map((c, i) => {
        const Icon = iconMap[c.slug] ?? Tag;
        const gradient = colorPalette[i % colorPalette.length];
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
            className={`group flex min-w-[7rem] shrink-0 animate-in fade-in slide-in-from-bottom-3 flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md duration-500 transition-all hover:scale-105 hover:shadow-2xl md:min-w-0`}
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
