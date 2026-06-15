import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </span>
            Quillacentr<span className="text-accent">O</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            El marketplace de los comercios físicos del Centro de Barranquilla.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Explorar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Buscar productos</Link></li>
            <li><Link to="/map" className="hover:text-foreground">Mapa de comercios</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Para comercios</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Registrá tu comercio</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Panel de control</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Términos y condiciones</li>
            <li>Política de privacidad</li>
            <li>Contacto</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} QuillacentrO · Barranquilla, Colombia
      </div>
    </footer>
  );
}
