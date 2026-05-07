import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  monthlySeries, last30Days, peakHours, diseaseTrends, topMedicines, doctorPerformance, fmtMoney,
} from "@/lib/demo-data";

const colors = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];

export default function Analytics() {
  const returningRate = monthlySeries.map((m, i) => ({ month: m.month, rate: 28 + i * 1.8 + Math.sin(i * 0.6) * 6 }));
  const profitabilityByMed = topMedicines.map((m, i) => ({ name: m.name, profit: Math.round((m.revenue || 0) * (0.32 + i * 0.04)) }));

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        subtitle="Cross-functional dashboards: revenue, profit, prescriptions, doctors, peak hours, and patient growth."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><FileDown className="h-4 w-4"/> Export PDF</Button>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Revenue trend (12 months)</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">{fmtMoney(monthlySeries.reduce((s,m)=>s+m.revenue,0))}</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} width={40}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v as number)}/>
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rev2)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Profit vs prescriptions</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Monthly</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" yAxisId="left" tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} width={36}/>
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={36}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
                <Bar yAxisId="left" dataKey="profit" name="Profit" fill="hsl(var(--chart-3))" radius={[3,3,0,0]}/>
                <Bar yAxisId="right" dataKey="prescriptions" name="Prescriptions" fill="hsl(var(--chart-2))" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Patient growth</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Last 30 days</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30Days}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" interval={4}/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={28}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Line type="monotone" dataKey="patients" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Returning patient rate</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Trend</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={returningRate}>
                <defs>
                  <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" unit="%" width={32}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `${(v as number).toFixed(1)}%`}/>
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#ret)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Disease trends</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Top conditions</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseTrends} layout="vertical">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false}/>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))"/>
                <YAxis type="category" dataKey="disease" tickLine={false} axisLine={false} fontSize={11} width={70} stroke="hsl(var(--muted-foreground))"/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Peak hours</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Today's flow</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={28}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Bar dataKey="visits" fill="hsl(var(--chart-1))" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Doctor mix</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Capacity radar</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={doctorPerformance.map(d => ({ subject: d.doctor.split(" ")[0], rx: d.prescriptions, pat: d.patients }))}>
                <PolarGrid stroke="hsl(var(--border))"/>
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}/>
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}/>
                <Radar name="Prescriptions" dataKey="rx" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3}/>
                <Radar name="Patients" dataKey="pat" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3}/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Medicine profitability</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Top contributors</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitabilityByMed} layout="vertical">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false}/>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={70} stroke="hsl(var(--muted-foreground))"/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v as number)}/>
                <Bar dataKey="profit" fill="hsl(var(--chart-3))" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
