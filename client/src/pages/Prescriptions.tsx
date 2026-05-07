import { useState, useMemo } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pill, Stethoscope, FileDown, Calendar, Loader2 } from "lucide-react";
import { fmtMoney, fmtRelative } from "@/lib/seed-data";
import { useStore } from "@/lib/store";

export default function Prescriptions() {
  const [q, setQ] = useState("");
  const { prescriptions, patients, doctors, loading } = useStore();

  const filtered = useMemo(() => prescriptions.filter(r => {
    if (!q) return true;
    const p = patients.find(x => x.id === r.patientId);
    return (
      p?.fullName.toLowerCase().includes(q.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(q.toLowerCase())
    );
  }), [q, prescriptions, patients]);

  return (
    <PageContainer>
      <PageHeader
        title="Prescriptions"
        subtitle={`${prescriptions.length} total prescriptions for your clinic`}
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
          <Input
            placeholder="Search by patient or diagnosis…"
            className="pl-8 h-9"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </Card>

      {loading && prescriptions.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Pill className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-[14px]">
            {q ? "No prescriptions match your search" : "No prescriptions yet"}
          </p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {q ? "Try a different patient name or diagnosis." : "Create your first prescription to get started."}
          </p>
          {!q && (
            <Link href="/prescriptions/new">
              <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New prescription
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => {
            const p = patients.find(x => x.id === r.patientId);
            const d = doctors.find(x => x.id === r.doctorId);
            return (
              <Link key={r.id} href={`/prescriptions/${r.id}`}>
                <Card className="p-4 border-card-border hover-elevate cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate group-hover:text-primary">
                        {p?.fullName ?? <span className="text-muted-foreground italic">Unknown patient</span>}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground tabular-nums font-mono">
                        {p?.mrn ?? "—"}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize text-[10px] shrink-0 ${
                        r.status === "active"
                          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : r.status === "completed"
                          ? "border-border text-muted-foreground"
                          : "border-amber-500/40 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[12.5px]">
                    <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{r.diagnosis}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <Pill className="h-3 w-3" />
                    <span>{r.items?.length ?? 0} medicines · {fmtMoney(r.total)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{fmtRelative(r.createdAt)}</span>
                    {d && <span className="ml-1 truncate">· {d.fullName}</span>}
                    {!d && r.doctorId && <span className="ml-1 italic">· Unassigned</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
