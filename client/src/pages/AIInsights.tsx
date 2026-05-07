import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mic, ScanText, Bot, RefreshCw, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIInsights() {
  const { toast } = useToast();
  return (
    <PageContainer>
      <PageHeader
        title={<span className="flex items-center gap-2">AI insights <Badge variant="outline" className="border-primary/30 text-primary">Demo</Badge></span>}
        subtitle="Assistive intelligence: medicine recommendations, refill suggestions, OCR, voice notes."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="h-4 w-4"/> Re-run analysis</Button>}
      />

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-300 px-4 py-3 mb-5 text-[12.5px] flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0"/>
        AI suggestions in ClinicPulse are <span className="font-medium">assistive demos</span> only — not a substitute for clinical judgment or medical advice.
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 border-card-border lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-primary"/>
            <div className="text-[13px] font-medium">Clinic insights</div>
          </div>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", title: "Revenue up 18% YoY",
                body: "Q2 follow-up appointments converted 22% more often than Q1. Consider adding a Sunday clinic at Gulberg Main." },
              { icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", title: "Inventory: 4 SKUs at risk",
                body: "Cefixime, ORS Sachet, Augmentin and Insulin Mixtard are below safety stock. Estimated 3-day cover." },
              { icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", title: "Patient retention dip in F-7 Markaz",
                body: "Returning rate fell from 41% to 36% over 30 days. Reminder cadence may be missing follow-ups beyond 14 days." },
              { icon: Lightbulb, color: "text-primary", title: "Pricing opportunity",
                body: "Atorvastatin margin (28%) is 14 points below catalog avg. Switching supplier to Highnoon may add ₨ 84K/mo." },
            ].map((it, i) => (
              <div key={i} className="rounded-md border border-border p-3.5 hover-elevate">
                <div className={`flex items-center gap-2 ${it.color}`}>
                  <it.icon className="h-4 w-4"/>
                  <div className="text-[13px] font-medium">{it.title}</div>
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-1.5 pl-6">{it.body}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <ScanText className="h-4 w-4 text-primary"/>
              <div className="text-[13px] font-medium">OCR report scanner</div>
            </div>
            <div className="rounded-md border border-dashed border-border p-6 text-center text-[12px] text-muted-foreground hover-elevate cursor-pointer" onClick={() => toast({ title: "Scanned", description: "Lab report parsed successfully (demo)." })}>
              <ScanText className="h-6 w-6 mx-auto opacity-60 mb-2"/>
              Drop a lab report image, or click to scan.
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-4 w-4 text-primary"/>
              <div className="text-[13px] font-medium">Voice-to-text notes</div>
            </div>
            <button onClick={() => toast({ title: "Listening...", description: "Recording — voice notes will appear here." })} className="w-full rounded-md border border-dashed border-border p-6 text-center text-[12px] text-muted-foreground hover-elevate">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 grid place-items-center ring-pulse">
                <Mic className="h-5 w-5 text-primary"/>
              </div>
              <div className="mt-2">Tap to dictate a SOAP note</div>
            </button>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary"/>
              <div className="text-[13px] font-medium">Auto refill suggestions</div>
            </div>
            <div className="space-y-2">
              {["Metformin 500mg — 12 patients overdue", "Telmisartan 40mg — 8 due in 7d", "Atorvastatin 20mg — 5 due"].map((t, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-b border-border/60 last:border-0">
                  <span className="truncate">{t}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5">Send</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
