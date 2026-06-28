import { cn } from "@/lib/utils";

type Variant = "full" | "mark";

export function UlLogo({
  variant = "full",
  className,
  showTagline = false,
}: {
  variant?: Variant;
  className?: string;
  showTagline?: boolean;
}) {
  const logoUrl = "/ul-logo.jpg";

  if (variant === "mark") {
    return (
      <div className={cn("grid place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-border shadow-sm", className ?? "h-10 w-10")}>
        <img src={logoUrl} alt="Logo Université de Lomé" className="h-full w-full object-contain p-1" loading="eager" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-border shadow-sm">
        <img src={logoUrl} alt="Logo Université de Lomé" className="h-full w-full object-contain p-1" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-base font-bold tracking-tight">JOBS ÉTUDIANTS</div>
        {showTagline && (
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Université de Lomé
          </div>
        )}
      </div>
    </div>
  );
}