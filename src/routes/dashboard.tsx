import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await requireRole(["comercio", "admin", "super_admin"], location.href);
  },
  head: () => ({
    meta: [{ title: "Panel Comercio — QuillacentrO" }],
  }),
  component: DashboardShell,
});

function DashboardShell() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <DashboardLayout />
      <Footer />
    </div>
  );
}
