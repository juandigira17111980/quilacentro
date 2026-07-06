import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { myComercioQuery, myQueriesQuery, type MyConsulta } from "@/lib/dashboardQueries";

export const Route = createFileRoute("/dashboard/queries")({
  component: QueriesPage,
});

function QueriesPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const { data: comercio } = useQuery({ ...myComercioQuery(userId ?? ""), enabled: !!userId });
  const { data: consultas = [], isLoading } = useQuery(myQueriesQuery(comercio?.id));
  const [selected, setSelected] = useState<MyConsulta | null>(null);

  const updateEstado = async (id: string, estado: "leido" | "respondido") => {
    const { error } = await supabase
      .from("consultas")
      .update({ estado } as never)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["my-queries"] });
      if (selected?.id === id) setSelected({ ...selected, estado });
    }
  };

  const openConsulta = (c: MyConsulta) => {
    setSelected(c);
    if (c.estado === "nuevo") void updateEstado(c.id, "leido");
  };

  if (!comercio) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Primero creá tu comercio en "Mi comercio".
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Consultas</h1>
        <p className="text-sm text-muted-foreground">
          Mensajes de clientes interesados en tus productos.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : consultas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no recibiste consultas.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {consultas.map((c) => (
              <button
                key={c.id}
                onClick={() => openConsulta(c)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">
                      {c.profiles?.full_name ?? "Cliente anónimo"}
                      {c.productos?.nombre && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {c.productos.nombre}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        c.estado === "nuevo"
                          ? "default"
                          : c.estado === "respondido"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {c.estado}
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{c.mensaje}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(c.created_at), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.profiles?.full_name ?? "Cliente anónimo"}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(selected.created_at), "dd MMM yyyy HH:mm")} · canal{" "}
                  {selected.canal}
                </div>
                {selected.productos?.nombre && (
                  <div className="rounded-md bg-muted p-2 text-sm">
                    Sobre: <span className="font-medium">{selected.productos.nombre}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-sm">
                  {selected.mensaje}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateEstado(selected.id, "leido")}
                  >
                    Marcar leída
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => updateEstado(selected.id, "respondido")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Respondida
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
