import { createContext, useContext } from "react";
import type { MyComercio } from "@/lib/dashboardQueries";

export type DashboardStoreState = {
  userId: string | null;
  comercios: MyComercio[];
  comercio: MyComercio | null;
  loading: boolean;
  error: string | null;
  selectComercio: (id: string) => void;
  retry: () => void;
};

export const DashboardStoreContext = createContext<DashboardStoreState | null>(null);

export function useDashboardStore() {
  const context = useContext(DashboardStoreContext);
  if (!context) throw new Error("El panel de comercio requiere DashboardStoreProvider");
  return context;
}
