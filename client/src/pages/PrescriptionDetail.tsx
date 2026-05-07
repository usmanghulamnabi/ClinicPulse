import { useRoute, Link } from "wouter";
import { PageContainer } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/Logo";
import { ArrowLeft, Printer, Share2, MessageSquare, Mail, Download } from "lucide-react";
import { BRANCHES, fmtMoney } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

export default function PrescriptionDetail() {
  const [, params] = useRoute("/prescriptions/:id");
  const id = parseInt(params?.id ?? "1");
  const { prescriptions, patients, doctors, medicines } = useStore();
  const r = prescriptions.find(x => x.id === id) ?? prescriptions[0];
  const p = patients.find(x => x.id === r?.patientId);
  const d = doctors.find(x => x.id === r?.doctorId);
  const branch = BRANCHES.find(b => b.id === (p?.branchId ?? 1));
  const { toast } = useToast();

  if (!r || !p) {
    return (
      <PageContainer>
        <Link href="/prescriptions" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to prescriptions
        </Link>
        <Card className="p-6 text-center text-muted-foreground">Prescription not found.</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 no-print">
        <Link href="/prescriptions" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to prescriptions
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Sent via WhatsApp", description: `Sent to ${p.phone}` })}><MessageSquare className="h-4 w-4" /> WhatsApp</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Emailed prescription", description: `Sent to ${p.email}` })}><Mail className="h-4 w-4" /> Email</Button>
          <Button size="sm" className="gap-1.5" onClick={() => toast({ title: "PDF downloaded", description: `Rx-${r.id}.pdf saved` })}><Download className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      {/* Print-ready prescription document */}
      <Card className="print-page mx-auto max-w-[860px] p-10 border-card-border bg-white text-black dark:bg-card dark:text-foreground">
        <div className="flex items-start justify-between border-b-2 border-primary pb-5">
          <div className="flex items-start gap-3">
            <LogoMark className="h-12 w-12" />
            <div>
              <div className="text-xl font-semibold tracking-tight text-primary">ClinicPulse Health</div>
              <div className="text-[12px] text-muted-foreground">{branch?.name ?? "ClinicPulse Health"} · {branch?.address ?? ""} · {branch?.phone ?? ""}</div>
            </div>
          </div>
          <div className="text-right text-[12px]">
            <div className="font-semibold text-[14px]">{d?.fullName ?? "Clinician"}</div>
            <div className="text-muted-foreground">{d?.specialty ?? ""}</div>
            <div className="text-muted-foreground">PMC# 12345-A · MD, FCPS</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 py-5 border-b border-border text-[12.5px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Patient</div>
            <div className="font-medium">{p.fullName}</div>
            <div className="text-muted-foreground">{p.mrn} · {p.gender} · {p.age}y · {p.bloodGroup}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Date</div>
            <div className="font-medium">{new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div className="text-muted-foreground">Rx #{String(r.id).padStart(5, "0")}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Allergies</div>
            {p.allergies.length ? (
              <div className="space-y-0.5">{p.allergies.map(a => <Badge key={a} variant="outline" className="border-rose-500/40 text-rose-600 mr-1">{a}</Badge>)}</div>
            ) : <div className="italic text-muted-foreground">NKDA</div>}
          </div>
        </div>

        <div className="py-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Diagnosis</div>
          <div className="text-[14px] font-medium">{r.diagnosis}</div>
        </div>

        <div className="py-5 border-t border-border">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-3xl font-serif text-primary">℞</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Prescription</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left py-2 font-medium">#</th>
                <th className="text-left py-2 font-medium">Medicine</th>
                <th className="text-left py-2 font-medium">Dose</th>
                <th className="text-left py-2 font-medium">Frequency</th>
                <th className="text-right py-2 font-medium">Days</th>
                <th className="text-right py-2 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((it, i) => {
                const m = medicines.find(x => x.id === it.medicineId);
                return (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-3 num">{i+1}</td>
                    <td className="py-3"><div className="font-medium">{m?.name ?? "Unknown"}</div><div className="text-muted-foreground text-[11.5px]">{m?.generic ?? ""}</div></td>
                    <td className="py-3 num">{it.dose}</td>
                    <td className="py-3 font-mono num">{it.frequency}</td>
                    <td className="py-3 text-right num">{it.duration}</td>
                    <td className="py-3 text-right num">{it.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-5 border-t border-border text-[12px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Advice</div>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Take medications with full glass of water.</li>
              <li>Avoid skipping doses; complete the antibiotic course.</li>
              <li>Follow-up in 7 days or sooner if symptoms worsen.</li>
              <li>Maintain hydration and adequate rest.</li>
            </ul>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Signature</div>
            <div className="inline-block min-h-[64px]">
              <svg viewBox="0 0 220 60" className="w-[200px] h-[60px] text-primary"><path d="M10 40 C 30 10, 50 50, 70 30 S 110 10, 130 40 S 180 30, 210 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            </div>
            <div className="text-[12px] font-medium">{d?.fullName ?? "Clinician"}</div>
            <div className="text-[10.5px] text-muted-foreground">PMC# 12345-A · {d?.specialty ?? ""}</div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Generated by ClinicPulse · {fmtMoney(r.total)} estimated medicine cost</span>
          <span>Generated by ClinicPulse · Confidential</span>
        </div>
      </Card>
    </PageContainer>
  );
}
