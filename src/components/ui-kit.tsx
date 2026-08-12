import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-mono">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: number | null;
  highlight?: boolean;
}) {
  return (
    <div className={cn("p-5", highlight ? "panel-glow" : "panel")}>
      <div className="flex items-start justify-between gap-2">
        <p className="label-mono">{label}</p>
        {typeof trend === "number" && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              trend >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight md:text-[28px]">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel grid place-items-center px-6 py-14 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-mono text-xs font-bold tracking-[0.14em] uppercase">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
