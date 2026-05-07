import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Plus, Search, FileDown, Receipt, TrendingUp, AlertCircle, Banknote } from "lucide-react";
import { PAYMENTS, PATIENTS, fmtMoney, last30Days } from "@/lib/demo-data";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid,
} from "recharts";

const METHOD_COLORS: Record<string, string> = {
  Cash: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Card: "bg-primary/15 text-primary",
  JazzCash: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  Easypaisa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Bank: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export default function Billing() {
  const [q, setQ] = useState("");
  const list = useMemo(() => PAYMENTS.filter(p => {
    if (!q) return true;
    const pat = PATIENTS.find(x => x.id === p.patientId);
    return p.invoiceNo.toLowerCase().includes(q.toLowerCase()) || pat?.fullName.toLowerCase().includes(q.toLowerCase());
  }), [q]);
  const totalPaid = PAYMENTS.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const dues = PAYMENTS.filter(p => p.status === "due").reduce((s, p) => s + p.amount, 0);
  const todayRevenue = last30Days[last30Days.length - 1].revenue;

  return (
    <PageContainer>
      <PageHeader
        title="Billing & invoices"
        subtitle="Track invoices, dues, and payment methods across patients."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><FileDown className="h-4 w-4"/> Export</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/> New invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Today revenue" value={todayRevenue} format={fmtMoney} icon={Banknote} delta={3.2} accent="primary" />
        <KpiCard label="MTD collected" value={totalPaid} format={fmtMoney} icon={Receipt} delta={5.8} accent="emerald" />
        <KpiCard label="Outstanding dues" value={dues} format={fmtMoney} icon={AlertCircle} delta={-1.4} accent="rose" />
        <KpiCard label="Avg invoice" value={Math.round(totalPaid / PAYMENTS.length)} format={fmtMoney} icon={TrendingUp} delta={1.1} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Daily revenue</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Last 30 days</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Days}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" interval={4}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v as number)}/>
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Payment methods</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Distribution</div>
          <div className="space-y-2.5">
            {Object.keys(METHOD_COLORS).map(m => {
              const sum = PAYMENTS.filter(p => p.method === m && p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const pct = sum / totalPaid * 100;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium">{m}</span>
                    <span className="num text-muted-foreground">{fmtMoney(sum)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-3 mb-4 border-card-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search by invoice or patient name…" className="pl-8 h-9" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
      </Card>

      <Card className="border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-4 py-2.5">Invoice</th>
                <th className="text-left font-medium px-4 py-2.5">Patient</th>
                <th className="text-left font-medium px-4 py-2.5">Method</th>
                <th className="text-right font-medium px-4 py-2.5">Amount</th>
                <th className="text-left font-medium px-4 py-2.5">Date</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 40).map(p => {
                const pat = PATIENTS.find(x => x.id === p.patientId)!;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono num">{p.invoiceNo}</td>
                    <td className="px-4 py-2.5">{pat.fullName}</td>
                    <td className="px-4 py-2.5"><span className={`text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${METHOD_COLORS[p.method]}`}>{p.method}</span></td>
                    <td className="px-4 py-2.5 text-right font-medium num">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={p.status === "due" ? "border-rose-500/40 text-rose-600 dark:text-rose-400" : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
