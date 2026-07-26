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
    <section className="bg-[#1B1124] py-16 md:py-24">
      <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2">
        <div className="text-white">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            ¿Tienes un negocio en el Centro?
          </h2>
          <p className="mt-3 max-w-md text-base text-white/70">
            Haz que más personas encuentren lo que vendes. Publica tus productos y recibe consultas
            directas.
          </p>
          <ul className="mt-6 space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/90">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gold">
                  <Check className="h-3 w-3 text-[#1B1124]" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-md bg-brand-gold px-7 text-base font-bold text-[#1B1124] hover:bg-brand-gold/90"
          >
            <Link to="/auth">
              Registra tu negocio gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <img
            src="/images/mercanta-centro-hero.png"
            alt="Comercio local de Mercanta"
            loading="lazy"
            className="w-full object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
