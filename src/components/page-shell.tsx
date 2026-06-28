import { type ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-2 pt-6 md:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <div className="px-4 py-6 md:px-8">{children}</div>;
}

export function StatCard({
  label, value, icon: Icon, hint, accent,
}: { label: string; value: string | number; icon: any; hint?: string; accent?: "primary" | "accent" | "success" }) {
  const ringClass =
    accent === "accent"
      ? "from-accent/25 to-transparent text-accent"
      : accent === "success"
      ? "from-success/25 to-transparent text-success"
      : "from-primary/25 to-transparent text-primary";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elegant">
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${ringClass} opacity-60 blur-2xl transition-opacity group-hover:opacity-100`} />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-background/40 ${accent === "accent" ? "text-accent" : accent === "success" ? "text-success" : "text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="relative mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
