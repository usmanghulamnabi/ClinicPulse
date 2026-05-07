import { useState, useMemo } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pill, Stethoscope, FileDown, Calendar } from "lucide-react";
import { PRESCRIPTIONS, PATIENTS, DOCTORS, MEDICINES, fmtMoney, fmtRelative } from "@/lib/demo-data";

export default function Prescriptions() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => PRESCRIPTIONS.filter(r => {
    if (!q) return true;
    const p = PATIENTS.find(x => x.id === r.patientId);
    return p?.fullName.toLowerCase().includes(q.toLowerCase()) || r.diagnosis.toLowerCase().includes(q.toLowerCase());
  }), [q]);

  return (
    <PageContainer>
      <PageHeader
        title="Prescriptions"
        subtitle={`${PRESCRIPTIONS.length} total prescriptions across all doctors and branches`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><FileDown className="h-4 w-4" /> Export</Button>
            <Link href="/prescriptions/new">
              <Button size="sm" className="gap-1.5" data-testid="button-new-rx"><Plus className="h-4 w-4" /> New prescription</Button>
            </Link>
          </>
        }
      />

      <Card className="p-3 mb-4 border-card-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient or diagnosis…" className="pl-8 h-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 30).map(r => {
          const p = PATIENTS.find(x => x.id === r.patientId)!;
          const d = DOCTORS.find(x => x.id === r.doctorId)!;
          return (
            <Link key={r.id} href={`/prescriptions/${r.id}`}>
              <Card className="p-4 border-card-border hover-elevate cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate group-hover:text-primary">{p.fullName}</div>
                    <div className="text-[11.5px] text-muted-foreground tabular-nums font-mono">{p.mrn}</div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{r.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[12.5px]">
                  <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{r.diagnosis}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <Pill className="h-3.5 w-3.5" /> {r.items.length} medicines · <Calendar className="h-3 w-3" /> {fmtRelative(r.createdAt)}
                </div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-[11px] text-muted-foreground">{d.fullName}</div>
                  <div className="font-semibold num text-[13px]">{fmtMoney(r.total)}</div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
