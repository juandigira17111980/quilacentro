import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AIAssistant } from "./AIAssistant";

export function AppShell({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 animate-in fade-in duration-300">{children}</main>
      {!hideFooter && <Footer />}
      <AIAssistant />
    </div>
  );
}
