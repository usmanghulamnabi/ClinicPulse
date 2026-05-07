import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Phone, Users, Stethoscope, Pill, Receipt } from "lucide-react";
import { BRANCHES, USERS, PATIENTS, MEDICINES, fmtMoney, monthlySeries } from "@/lib/demo-data";

export default function Branches() {
  return (
    <PageContainer>
      <PageHeader
        title="Branches"
        subtitle={`${BRANCHES.length} active branches across Pakistan`}
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/> Add branch</Button>}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BRANCHES.map((b, i) => {
          const staff = USERS.filter(u => u.branchId === b.id).length;
          const doctors = USERS.filter(u => u.branchId === b.id && u.role === "doctor").length;
          const patients = PATIENTS.filter(p => p.branchId === b.id).length;
          const monthRev = Math.round(monthlySeries[monthlySeries.length - 1].revenue / BRANCHES.length * (1 + (i - 1) * 0.15));
          return (
            <Card key={b.id} className="p-5 border-card-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center"><Building2 className="h-4 w-4 text-primary"/></div>
                    <div>
                      <div className="text-[14px] font-semibold">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground">{b.city}</div>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">Online</Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-[12.5px] text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/>{b.address}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5"/>{b.phone}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-[12px]"><Users className="h-3.5 w-3.5 text-muted-foreground"/><span className="num font-medium">{staff}</span> <span className="text-muted-foreground">staff</span></div>
                <div className="flex items-center gap-1.5 text-[12px]"><Stethoscope className="h-3.5 w-3.5 text-muted-foreground"/><span className="num font-medium">{doctors}</span> <span className="text-muted-foreground">doctors</span></div>
                <div className="flex items-center gap-1.5 text-[12px]"><Users className="h-3.5 w-3.5 text-muted-foreground"/><span className="num font-medium">{patients}</span> <span className="text-muted-foreground">patients</span></div>
                <div className="flex items-center gap-1.5 text-[12px]"><Pill className="h-3.5 w-3.5 text-muted-foreground"/><span className="num font-medium">{Math.floor(MEDICINES.length * 0.85)}</span> <span className="text-muted-foreground">SKUs</span></div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5"><Receipt className="h-3 w-3"/> MTD revenue</span>
                <span className="font-semibold num text-primary">{fmtMoney(monthRev)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
