import { cn } from "@/lib/utils";

export function PageHeader({
  title, subtitle, actions, className,
}: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-page-title">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-4 md:px-6 py-6 md:py-8 max-w-[1400px] mx-auto w-full", className)}>{children}</div>;
}
