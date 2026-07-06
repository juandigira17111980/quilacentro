import { Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BULLETS = [
  "Perfil gratuito para tu negocio",
  "Publica hasta 10 productos sin costo",
  "Recibe consultas directas por WhatsApp",
  "Estadísticas de visitas en tiempo real",
];

export function MerchantCta() {
  return (
    <section className="bg-[#1a2b4a] py-16 md:py-24">
      <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2">
        <div className="text-white">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            ¿Tienes un negocio en el Centro?
          </h2>
          <p className="mt-3 max-w-md text-base text-slate-300">
            Lleva tu comercio al siguiente nivel. Publica tus productos gratis y llega a miles de
            clientes.
          </p>
          <ul className="mt-6 space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-slate-100">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-full bg-orange-500 px-7 text-base font-bold text-white hover:bg-orange-600"
          >
            <Link to="/auth">
              Registra tu negocio gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
            alt="Comerciante atendiendo en su tienda"
            loading="lazy"
            className="w-full rounded-3xl object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
