import type { ReactNode } from "react";
import { AppShell } from "@/components/site/AppShell";

export function PagePlaceholder({
  badge,
  title,
  description,
  icon,
  children,
}: {
  badge?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {icon && (
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
              {icon}
            </div>
          )}
          {badge && (
            <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              {badge}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        {children && <div className="mx-auto mt-10 max-w-5xl">{children}</div>}
      </section>
    </AppShell>
  );
}
