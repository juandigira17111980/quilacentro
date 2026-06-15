import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Search, Menu, User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const nav = [
  { to: "/search", label: "Buscar" },
  { to: "/map", label: "Mapa" },
];

export function Header() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setRole((data as { role?: string } | null)?.role ?? "cliente"));
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isComercio = role === "comercio";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <span>cerca<span className="text-primary">.</span></span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/search"
            className="hidden items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex"
          >
            <Search className="h-4 w-4" />
            <span>Buscar comercios, productos…</span>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isComercio && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Panel Comercio</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Ingresar</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader><SheetTitle className="font-display">Menú</SheetTitle></SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {nav.map((item) => (
                  <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <Link to="/auth" className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                    Ingresar
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
