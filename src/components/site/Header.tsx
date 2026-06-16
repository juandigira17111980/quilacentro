import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Menu, User, LogOut, LayoutDashboard, ShieldCheck, MapPin, Store, Home } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  { to: "/", label: "Inicio", exact: true },
  { to: "/search", label: "Buscar" },
  { to: "/map", label: "Mapa" },
  { to: "/dashboard", label: "Comercios" },
];

export function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupaUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const loadProfile = async (u: SupaUser) => {
      const { data } = await supabase.rpc("get_my_profile");
      const p = Array.isArray(data) ? (data[0] as { role?: string; full_name?: string } | undefined) : null;
      setRole(p?.role ?? "cliente");
      setFullName(p?.full_name ?? u.email ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        void loadProfile(u);
      } else {
        setRole(null);
        setFullName(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) void loadProfile(u);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as never });
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isComercio = role === "comercio";
  const displayName = fullName?.split(" ")[0] ?? "Cuenta";

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-[0_4px_16px_-4px_rgb(26_43_74_/_0.10)]" : ""
      }`}
    >
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 md:gap-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">
            Quillacentr<span className="text-accent">O</span>
          </span>
        </Link>

        {/* Central search */}
        <form onSubmit={submitSearch} className="relative mx-auto hidden max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar productos, comercios o categorías…"
            className="h-11 rounded-full border-2 bg-muted/40 pl-11 pr-4 text-sm shadow-none focus-visible:bg-card focus-visible:ring-accent"
          />
        </form>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-primary bg-primary-soft" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <div className="font-semibold">{fullName ?? "Mi cuenta"}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
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
            <Button
              asChild
              size="sm"
              className="hidden rounded-full bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex"
            >
              <Link to="/auth">Ingresar</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  Quillacentr<span className="text-accent">O</span>
                </SheetTitle>
              </SheetHeader>

              <form onSubmit={submitSearch} className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  className="h-10 rounded-full pl-9"
                />
              </form>

              <nav className="mt-6 flex flex-col gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Admin</span>
                </Link>
                {!user && (
                  <Link
                    to="/auth"
                    className="mt-2 rounded-full bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-foreground"
                  >
                    Ingresar
                  </Link>
                )}
                <Link
                  to="/auth"
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Store className="h-4 w-4" /> Soy comercio
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
