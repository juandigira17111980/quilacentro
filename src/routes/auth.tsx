import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, User, Store } from "lucide-react";
import { getCurrentRole, landingForRole } from "@/lib/auth";

const authSearch = z.object({
  redirect: fallback(z.string(), "").default(""),
  mode: fallback(z.enum(["signin", "signup"]), "signin").default("signin"),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar — QuillacentrO" },
      { name: "description", content: "Ingresá o creá tu cuenta en QuillacentrO." },
    ],
  }),
  validateSearch: zodValidator(authSearch),
  component: AuthPage,
});

type AccountType = "cliente" | "comercio";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect, mode } = useSearch({ from: "/auth" });

  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("cliente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // If already signed in, send the user to where they belong.
  useEffect(() => {
    (async () => {
      const session = await getCurrentRole();
      if (!session) return;
      const target = redirect || landingForRole(session.role);
      navigate({ to: target as "/" });
    })();
  }, [navigate, redirect]);

  const goAfterAuth = async () => {
    const session = await getCurrentRole();
    const target = redirect || (session ? landingForRole(session.role) : "/");
    navigate({ to: target as "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role: accountType },
          },
        });
        if (error) throw error;
        // If email confirmation is required, no session is returned.
        if (!data.session) {
          setInfo("Te enviamos un mail para confirmar tu cuenta.");
          return;
        }
        await goAfterAuth();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goAfterAuth();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-soft via-background to-accent-soft">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-accent)_0%,_transparent_55%)] opacity-25" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-2 text-2xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          Quillacentr<span className="text-accent">O</span>
        </Link>

        <Card className="border-border/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>Ingresá o creá tu cuenta para empezar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => { setTab(v as "signin" | "signup"); setError(null); setInfo(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Ingresar</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4 space-y-3">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pw">Contraseña</Label>
                    <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ingresar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4 space-y-3">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pw2">Contraseña</Label>
                    <Input id="pw2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>¿Qué tipo de cuenta?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <AccountTypeCard
                        active={accountType === "cliente"}
                        onClick={() => setAccountType("cliente")}
                        icon={<User className="h-5 w-5" />}
                        label="Soy cliente"
                        desc="Quiero comprar"
                      />
                      <AccountTypeCard
                        active={accountType === "comercio"}
                        onClick={() => setAccountType("comercio")}
                        icon={<Store className="h-5 w-5" />}
                        label="Tengo un negocio"
                        desc="Quiero vender"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear cuenta
                  </Button>
                </form>
              </TabsContent>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert className="mt-4">
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al continuar aceptás nuestros términos y política de privacidad.
        </p>
      </div>
    </div>
  );
}

function AccountTypeCard({
  active, onClick, icon, label, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
        active ? "border-accent bg-accent-soft/40" : "border-border hover:border-accent/40"
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
