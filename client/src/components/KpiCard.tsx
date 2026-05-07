import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, durationMs = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, durationMs]);
  return val;
}

export function KpiCard({
  label, value, format, delta, hint, icon: Icon, accent,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number;
  hint?: string;
  icon?: React.ElementType;
  accent?: "primary" | "emerald" | "amber" | "rose";
}) {
  const v = useCountUp(value);
  const positive = (delta ?? 0) >= 0;
  const accentMap: Record<string, string> = {
    primary: "from-primary/15 to-primary/0 text-primary",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
    amber:   "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-400",
    rose:    "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-400",
  };
  const a = accentMap[accent ?? "primary"];
  return (
    <Card className="p-4 relative overflow-hidden border-card-border" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl pointer-events-none", a)} />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{label}</div>
        {Icon && <div className={cn("h-7 w-7 rounded-md grid place-items-center bg-primary/10", a.split(" ").pop())}><Icon className="h-4 w-4" /></div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <motion.div className="text-2xl font-semibold tracking-tight num">
          {format ? format(v) : Math.round(v).toLocaleString()}
        </motion.div>
        {typeof delta === "number" && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
            positive ? "text-emerald-700 bg-emerald-500/12 dark:text-emerald-300" : "text-rose-700 bg-rose-500/12 dark:text-rose-300"
          )}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && <div className="mt-1.5 text-[11px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}
