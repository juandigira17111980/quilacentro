import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { myComerciosQuery } from "@/lib/dashboardQueries";
import { DashboardStoreContext } from "@/components/dashboard/dashboard-store";

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUserId(data.user?.id ?? null);
      })
      .catch(() => {
        if (active) setUserId(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const storesQuery = useQuery({ ...myComerciosQuery(userId ?? ""), enabled: !!userId });
  const comercios = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);
  const savedId =
    userId && typeof window !== "undefined"
      ? window.localStorage.getItem(`mercanta:comercio:${userId}`)
      : null;
  const comercio = useMemo(
    () =>
      comercios.find((store) => store.id === selectedId) ??
      comercios.find((store) => store.id === savedId) ??
      comercios[0] ??
      null,
    [comercios, savedId, selectedId],
  );
  const selectComercio = useCallback(
    (id: string) => {
      if (!userId || !comercios.some((store) => store.id === id)) return;
      window.localStorage.setItem(`mercanta:comercio:${userId}`, id);
      setSelectedId(id);
    },
    [comercios, userId],
  );

  return (
    <DashboardStoreContext.Provider
      value={{
        userId,
        comercios,
        comercio,
        loading: !authReady || (!!userId && storesQuery.isPending),
        error: authReady && !userId ? "Tu sesión expiró" : (storesQuery.error?.message ?? null),
        selectComercio,
        retry: () => {
          void storesQuery.refetch();
        },
      }}
    >
      {children}
    </DashboardStoreContext.Provider>
  );
}
