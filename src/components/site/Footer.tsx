import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="border-t bg-[#1B1124] text-white">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <BrandLogo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            Busca menos. Encuentra más. El comercio del Centro de Barranquilla, más cerca.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-brand-gold">Explorar</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/search" className="hover:text-white">
                Buscar productos
              </Link>
            </li>
            <li>
              <Link to="/map" className="hover:text-white">
                Mapa de comercios
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-brand-gold">Para comercios</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/auth" className="hover:text-white">
                Registrá tu comercio
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-white">
                Panel de control
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-brand-gold">Mercanta</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Comercio local, cerca de ti</li>
            <li>Compra con confianza</li>
            <li>Barranquilla, Colombia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Mercanta · Barranquilla, Colombia
      </div>
    </footer>
  );
}
