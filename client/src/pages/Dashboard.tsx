import { useState } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Receipt, FileText, Boxes, AlertTriangle, CalendarRange, Plus, ArrowRight,
  TrendingUp, Activity, Pill, ShieldCheck, WalletCards, UserCheck,
} from "lucide-react";
import {
  dailyKPIs, monthlySeries, last30Days, peakHours, diseaseTrends, topMedicines,
  MEDICINES, PATIENTS, PRESCRIPTIONS, APPOINTMENTS, PAYMENTS, fmtMoney,
} from "@/lib/demo-data";

const chartColors = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];

export default function Dashboard() {
  const k = dailyKPIs();
  const [range, setRange] = useState<"day"|"week"|"month"|"year">("month");

  const todayAppts = APPOINTMENTS.filter(a => {
    const d = new Date(a.scheduledAt); const t = new Date(); return d.toDateString() === t.toDateString();
  }).slice(0, 6);

  const recentRx = [...PRESCRIPTIONS].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  const lowStock = MEDICINES.filter(m => m.stock <= m.lowStockAt).slice(0, 4);
  const expiring = MEDICINES.filter(m => m.expiry - Date.now() < 60*86400_000).slice(0, 4);
  const recentPatients = [...PATIENTS].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  const paidTotal = PAYMENTS.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const billedTotal = PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const collectionRate = Math.round((paidTotal / Math.max(1, billedTotal)) * 100);
  const grossMargin = Math.round((k.monthProfit / Math.max(1, k.monthRevenue)) * 100);
  const operationalScore = Math.max(78, Math.min(98, 100 - k.lowStock * 2 - k.expiringSoon + Math.round(grossMargin / 4)));
  return (
    <PageContainer>
      <PageHeader
        title={<span>Welcome back, <span className="text-primary">Dr. Sara</span></span>}
        subtitle="Here's how ClinicPulse Health is performing today."
        actions={
          <>
            <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="day"   className="h-7 text-[12px] px-2.5">Day</TabsTrigger>
                <TabsTrigger value="week"  className="h-7 text-[12px] px-2.5">Week</TabsTrigger>
                <TabsTrigger value="month" className="h-7 text-[12px] px-2.5">Month</TabsTrigger>
                <TabsTrigger value="year"  className="h-7 text-[12px] px-2.5">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Link href="/prescriptions/new">
              <Button size="sm" className="gap-1.5" data-testid="button-new-prescription"><Plus className="h-4 w-4" /> New prescription</Button>
            </Link>
          </>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-card-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.55))] p-5 md:p-6 mb-6 shadow-lg">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Command center live
            </div>
            <h2 className="mt-4 max-w-xl text-xl font-semibold tracking-tight">
              Clinic operations are healthy, with revenue momentum and manageable stock risk.
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">
              Monitor collections, margins, queue pressure, inventory exposure, and AI-prioritized work from one clinic dashboard.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Ops score", value: `${operationalScore}%`, icon: Activity, tone: "text-primary", sub: "SLA, queue, stock" },
                { label: "Collection rate", value: `${collectionRate}%`, icon: WalletCards, tone: "text-emerald-600 dark:text-emerald-400", sub: `${fmtMoney(k.dues)} outstanding` },
                { label: "Gross margin", value: `${grossMargin}%`, icon: TrendingUp, tone: "text-cyan-600 dark:text-cyan-300", sub: `${fmtMoney(k.monthProfit)} MTD profit` },
                { label: "Returning patients", value: "64%", icon: UserCheck, tone: "text-amber-600 dark:text-amber-400", sub: "+8.1% vs last month" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-card-border bg-background/60 p-3 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{m.label}</span>
                    <m.icon className={`h-4 w-4 ${m.tone}`} />
                  </div>
                  <div className="mt-2 text-xl font-semibold num">{m.value}</div>
                  <div className="text-[11px] text-muted-foreground">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-card-border bg-card/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Clinic snapshot</div>
                <div className="text-[15px] font-semibold">Monthly performance</div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Single clinic</Badge>
            </div>
            <div className="space-y-4">
              {[
                { name: "Patient visits", value: k.patientsTotal, total: Math.max(k.patientsTotal, 120), sub: `${k.appointmentsToday} appointments today` },
                { name: "Collections", value: paidTotal, total: Math.max(billedTotal, 1), sub: `${collectionRate}% collection rate` },
                { name: "Prescriptions", value: k.prescriptionsToday, total: Math.max(k.prescriptionsToday, 35), sub: `${PRESCRIPTIONS.length} prescriptions this month` },
              ].map((row) => (
                <div key={row.name}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <div className="font-medium">{row.name}</div>
                    <div className="num text-muted-foreground">{typeof row.value === "number" && row.value > 1000 ? fmtMoney(row.value) : row.value}</div>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      style={{ width: `${Math.min(100, Math.round((row.value / row.total) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{row.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Patients" value={k.patientsTotal} icon={Users} delta={4.2} hint="+12 this month" accent="primary" />
        <KpiCard label="Prescriptions today" value={k.prescriptionsToday} icon={FileText} delta={6.8} hint={`${PRESCRIPTIONS.length} this month`} accent="emerald" />
        <KpiCard label="Revenue today" value={k.todayRevenue} icon={Receipt} format={fmtMoney} delta={2.1} hint={`${fmtMoney(k.monthRevenue)} MTD`} accent="primary" />
        <KpiCard label="Profit today" value={k.todayProfit} icon={TrendingUp} format={fmtMoney} delta={-1.4} hint={`${fmtMoney(k.monthProfit)} MTD`} accent="amber" />
        <KpiCard label="Appointments" value={k.appointmentsToday} icon={CalendarRange} delta={1.9} hint={`${APPOINTMENTS.filter(a=>a.status==="scheduled").length} upcoming`} accent="primary" />
        <KpiCard label="Inventory value" value={k.inventoryValue} icon={Boxes} format={fmtMoney} delta={0.8} hint={`${MEDICINES.length} SKUs`} accent="emerald" />
        <KpiCard label="Low stock" value={k.lowStock} icon={AlertTriangle} hint="Reorder needed" accent="rose" />
        <KpiCard label="Pending dues" value={k.dues} icon={Receipt} format={fmtMoney} hint="Across patients" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 p-5 border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Revenue & profit</div>
              <div className="mt-0.5 text-[15px] font-semibold">{fmtMoney(k.yearRevenue)} <span className="text-muted-foreground font-normal">YTD</span></div>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">+18.3% YoY</Badge>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="hsl(var(--chart-1))" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="hsl(var(--chart-3))" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} width={40} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => fmtMoney(v as number)}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="profit"  name="Profit"  stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#prof)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top medicines */}
        <Card className="p-5 border-card-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Most prescribed</div>
              <div className="mt-0.5 text-[15px] font-semibold">Top 7 medicines</div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMedicines} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={70} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sold" fill="hsl(var(--chart-1))" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Last 30 days */}
        <Card className="p-5 border-card-border lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Patient & prescription growth</div>
              <div className="mt-0.5 text-[15px] font-semibold">Last 30 days</div>
            </div>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30Days} margin={{ left: 0, right: 0, top: 6 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" interval={4} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={28} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="patients" name="Patients" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="prescriptions" name="Prescriptions" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Disease trends pie */}
        <Card className="p-5 border-card-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Disease trends</div>
              <div className="mt-0.5 text-[15px] font-semibold">This month</div>
            </div>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={diseaseTrends} dataKey="count" nameKey="disease" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {diseaseTrends.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Today's appointments */}
        <Card className="p-5 border-card-border lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Today's queue</div>
              <div className="mt-0.5 text-[15px] font-semibold">{todayAppts.length} appointments</div>
            </div>
            <Link href="/appointments"><Button variant="ghost" size="sm" className="gap-1 text-[12px]">View all <ArrowRight className="h-3.5 w-3.5"/></Button></Link>
          </div>
          <div className="space-y-1.5">
            {todayAppts.map(a => {
              const p = PATIENTS.find(x => x.id === a.patientId)!;
              const time = new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const statusColor = {
                scheduled:    "bg-muted text-muted-foreground",
                checked_in:   "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                in_progress:  "bg-primary/15 text-primary",
                done:         "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                cancelled:    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
              }[a.status];
              return (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover-elevate" data-testid={`row-appt-${a.id}`}>
                  <div className="w-12 text-[12px] tabular-nums text-muted-foreground font-mono">{time}</div>
                  <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center text-[10.5px] font-semibold text-primary">{a.token}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{p.fullName}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">{a.reason} · <span className="capitalize">{a.channel.replace("_", " ")}</span></div>
                  </div>
                  <span className={`text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor}`}>{a.status.replace("_", " ")}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Alerts panel */}
        <Card className="p-5 border-card-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Alerts</div>
              <div className="mt-0.5 text-[15px] font-semibold">Needs attention</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-medium mb-1.5">Low stock</div>
              {lowStock.map(m => (
                <div key={m.id} className="flex items-center justify-between text-[12.5px] py-1">
                  <span className="truncate">{m.name}</span>
                  <span className="num text-muted-foreground">{m.stock} {m.unit}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium mb-1.5">Expiring &lt; 60d</div>
              {expiring.map(m => (
                <div key={m.id} className="flex items-center justify-between text-[12.5px] py-1">
                  <span className="truncate">{m.name}</span>
                  <span className="num text-muted-foreground">{Math.round((m.expiry - Date.now())/86400_000)}d</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Clinic activity */}
        <Card className="p-5 border-card-border lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Clinic activity</div>
              <div className="mt-0.5 text-[15px] font-semibold">Recent patient workload</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="text-left font-medium py-2">Patient</th>
                  <th className="text-left font-medium py-2">Diagnosis</th>
                  <th className="text-right font-medium py-2">Age</th>
                  <th className="text-right font-medium py-2">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2.5">
                      <div className="font-medium">{p.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">{p.mrn}</div>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{p.diagnosis}</td>
                    <td className="text-right num">{p.age}y</td>
                    <td className="text-right num text-muted-foreground">{new Date(p.lastVisitAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Peak hours + recent rx */}
        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Peak hours</div>
          <div className="mt-0.5 text-[15px] font-semibold mb-2">Today</div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={9} stroke="hsl(var(--muted-foreground))" interval={1}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Bar dataKey="visits" fill="hsl(var(--chart-2))" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Recent prescriptions</div>
            <div className="mt-2 space-y-1.5">
              {recentRx.map(r => {
                const p = PATIENTS.find(x => x.id === r.patientId)!;
                return (
                  <Link key={r.id} href={`/prescriptions/${r.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded hover-elevate">
                    <Pill className="h-3.5 w-3.5 text-primary"/>
                    <span className="text-[12.5px] truncate">{p.fullName}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{r.items.length} items</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5 border-card-border lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">New patient intake</div>
              <div className="mt-0.5 text-[15px] font-semibold">Recently registered</div>
            </div>
            <Link href="/patients"><Button variant="ghost" size="sm" className="gap-1 text-[12px]">Open directory <ArrowRight className="h-3.5 w-3.5"/></Button></Link>
          </div>
          <div className="grid md:grid-cols-5 gap-2">
            {recentPatients.map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`} className="rounded-xl border border-card-border bg-muted/30 p-3 hover-elevate">
                <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-[11px] font-semibold text-primary">
                  {p.fullName.split(" ").map(x => x[0]).join("").slice(0,2)}
                </div>
                <div className="mt-3 truncate text-[13px] font-medium">{p.fullName}</div>
                <div className="text-[11px] text-muted-foreground">{p.age}y · {p.bloodGroup}</div>
                <div className="mt-2 truncate text-[11px] text-muted-foreground">{p.diagnosis}</div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 border-card-border bg-gradient-to-br from-card to-primary/5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">AI operating note</div>
          <div className="mt-0.5 text-[15px] font-semibold">Recommended actions</div>
          <div className="mt-4 space-y-3">
            {[
              "Reorder Cefixime and Azithromycin before the evening queue.",
              "Call 7 patients with dues over 14 days for payment reminders.",
              "Open one extra 5pm slot on Friday based on recurring peak demand.",
            ].map((note, i) => (
              <div key={i} className="flex gap-2 text-[12.5px]">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Assistive demo only. Verify all clinical and operational suggestions before use.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
