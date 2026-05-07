import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Boxes } from "lucide-react";
import { EXPENSES, fmtMoney } from "@/lib/demo-data";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];

export default function Expenses() {
  const grouped = EXPENSES.reduce<Record<string, number>>((acc, e: any) => { acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount); return acc; }, {});
  const data = Object.entries(grouped).map(([category, amount]) => ({ category, amount: Math.round(amount) }));
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        subtitle={`${fmtMoney(total)} total over the last 90 days`}
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/> Record expense</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Distribution</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">By category</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">By category</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Breakdown</div>
          <div className="space-y-3">
            {data.map((d, i) => (
              <div key={d.category}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{d.category}</span>
                  <span className="num">{fmtMoney(d.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ width: `${(d.amount/total*100).toFixed(0)}%`, background: COLORS[i % COLORS.length] }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-4 py-2.5">Date</th>
                <th className="text-left font-medium px-4 py-2.5">Category</th>
                <th className="text-left font-medium px-4 py-2.5">Note</th>
                <th className="text-right font-medium px-4 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.slice(0, 30).map(e => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(e.spentAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5 text-muted-foreground"/>{e.category}</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.note}</td>
                  <td className="px-4 py-2.5 text-right font-medium num">{fmtMoney(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
