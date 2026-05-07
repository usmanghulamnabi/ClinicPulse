import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileDown, FileSpreadsheet, FileBarChart, FileText, ArrowRight } from "lucide-react";
import { fmtMoney, monthlySeries, dailyKPIs } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

const reports = [
  { id: "patient",      title: "Patient register",       desc: "All patients with demographics and last visit." },
  { id: "rx",           title: "Prescriptions",          desc: "Daily / monthly prescription log." },
  { id: "rev",          title: "Revenue & profit",       desc: "Daily, weekly, monthly, and yearly financial breakdown." },
  { id: "inv",          title: "Inventory valuation",    desc: "SKU-level stock, expiry and cost data." },
  { id: "med",          title: "Medicine usage",         desc: "Most prescribed and dispensed medicines." },
  { id: "appt",         title: "Appointments",           desc: "Booked, completed, no-show and cancellation report." },
  { id: "disease",      title: "Disease trends",         desc: "ICD-aligned disease frequency over time." },
  { id: "close",        title: "Daily closing",          desc: "Cash drawer, dues, deposits and end-of-day summary." },
  { id: "audit",        title: "Audit & compliance",     desc: "User actions, sessions, login activity." },
];

export default function Reports() {
  const k = dailyKPIs();
  const { toast } = useToast();
  const downloadAs = (fmt: string, label: string) => toast({ title: `${label} ready`, description: `${fmt.toUpperCase()} generated. Demo download.` });

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle="Generate and export operational, clinical, and financial reports."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadAs("csv", "All reports")}><FileSpreadsheet className="h-4 w-4"/> CSV</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadAs("xlsx", "All reports")}><FileSpreadsheet className="h-4 w-4"/> Excel</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadAs("pdf", "Monthly closing")}><FileDown className="h-4 w-4"/> Monthly PDF</Button>
          </>
        }
      />

      <Tabs defaultValue="library">
        <TabsList className="h-9">
          <TabsTrigger value="library" className="text-[12px]">Library</TabsTrigger>
          <TabsTrigger value="closing" className="text-[12px]">Daily closing</TabsTrigger>
          <TabsTrigger value="financial" className="text-[12px]">Financial summary</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map(r => (
              <Card key={r.id} className="p-4 border-card-border hover-elevate group cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center"><FileBarChart className="h-4 w-4 text-primary"/></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium">{r.title}</div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5">{r.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-1"/>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadAs("pdf", r.title)}><FileText className="h-3 w-3"/> PDF</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadAs("xlsx", r.title)}><FileSpreadsheet className="h-3 w-3"/> Excel</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadAs("csv", r.title)}><FileSpreadsheet className="h-3 w-3"/> CSV</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closing" className="mt-4">
          <Card className="p-6 border-card-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Daily closing — {new Date().toLocaleDateString()}</div>
            <div className="text-2xl font-semibold mt-1 num">{fmtMoney(k.todayRevenue)}</div>
            <div className="text-[12px] text-muted-foreground">collected today in your clinic</div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                ["Cash drawer", fmtMoney(k.todayRevenue * 0.35)],
                ["Card", fmtMoney(k.todayRevenue * 0.28)],
                ["JazzCash/Easypaisa", fmtMoney(k.todayRevenue * 0.18)],
                ["Bank deposits", fmtMoney(k.todayRevenue * 0.19)],
                ["Prescriptions issued", String(k.prescriptionsToday)],
                ["Patients seen", String(k.appointmentsToday)],
                ["Outstanding dues", fmtMoney(k.dues)],
                ["Net profit", fmtMoney(k.todayProfit)],
              ].map(([l, v], i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{l}</div>
                  <div className="text-[15px] font-semibold mt-1 num">{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <Card className="border-card-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Month</th>
                  <th className="text-right px-4 py-2.5 font-medium">Revenue</th>
                  <th className="text-right px-4 py-2.5 font-medium">Profit</th>
                  <th className="text-right px-4 py-2.5 font-medium">Margin</th>
                  <th className="text-right px-4 py-2.5 font-medium">Patients</th>
                  <th className="text-right px-4 py-2.5 font-medium">Rx</th>
                </tr>
              </thead>
              <tbody>
                {monthlySeries.map(m => (
                  <tr key={m.month} className="border-t border-border">
                    <td className="px-4 py-2.5 font-medium">{m.month}</td>
                    <td className="px-4 py-2.5 text-right num">{fmtMoney(m.revenue)}</td>
                    <td className="px-4 py-2.5 text-right num text-emerald-600 dark:text-emerald-400">{fmtMoney(m.profit)}</td>
                    <td className="px-4 py-2.5 text-right num">{((m.profit/m.revenue)*100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right num">{m.patients}</td>
                    <td className="px-4 py-2.5 text-right num">{m.prescriptions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
