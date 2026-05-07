import { cn } from "@/lib/utils";

/** ClinicPulse mark — abstract ECG/heartbeat wave inside a soft tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-label="ClinicPulse">
      <defs>
        <linearGradient id="cp-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(184 78% 22%)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#cp-grad)" />
      <path
        d="M8 34 L20 34 L24 22 L32 46 L38 30 L42 34 L56 34"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
  showTagline = true,
  taglineClassName,
}: {
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  taglineClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} data-testid="logo-clinicpulse">
      <LogoMark className="h-8 w-8 shrink-0" />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-semibold tracking-tight text-[15px]">ClinicPulse</span>
          {showTagline && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.14em] mt-0.5 text-muted-foreground/80",
                taglineClassName,
              )}
            >
              Health OS
            </span>
          )}
        </div>
      )}
    </div>
  );
}
