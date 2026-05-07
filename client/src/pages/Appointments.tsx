import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, ChevronLeft, ChevronRight, Clock, Bell, MessageSquare, Phone, MapPin, CalendarRange,
} from "lucide-react";
import { APPOINTMENTS, PATIENTS, DOCTORS, BRANCHES } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

export default function Appointments() {
  const [date, setDate] = useState(new Date());
  const { toast } = useToast();

  const dayAppts = useMemo(() => APPOINTMENTS.filter(a => {
    const d = new Date(a.scheduledAt);
    return d.toDateString() === date.toDateString();
  }).sort((a, b) => a.scheduledAt - b.scheduledAt), [date]);

  const queue = dayAppts.filter(a => ["scheduled","checked_in","in_progress"].includes(a.status));
  const upcomingWeek = APPOINTMENTS.filter(a => {
    const d = new Date(a.scheduledAt);
    const today = new Date();
    return d >= today && d <= new Date(today.getTime() + 7*86400_000);
  }).slice(0, 30);

  const shift = (n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d); };

  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        subtitle="Calendar, queue, and reminders for all branches."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Reminders sent", description: "WhatsApp & SMS reminders dispatched to today's patients." })}>
              <Bell className="h-4 w-4"/> Send reminders
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast({ title: "Booking opened", description: "Use the new appointment dialog (demo)." })}>
              <Plus className="h-4 w-4"/> Book appointment
            </Button>
          </>
        }
      />

      <Tabs defaultValue="day" className="mb-4">
        <TabsList className="h-9">
          <TabsTrigger value="day" className="text-[12px]">Day</TabsTrigger>
          <TabsTrigger value="queue" className="text-[12px]">Queue & tokens</TabsTrigger>
          <TabsTrigger value="week" className="text-[12px]">Upcoming week</TabsTrigger>
        </TabsList>

        {/* Day view */}
        <TabsContent value="day" className="mt-4">
          <Card className="border-card-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4"/></Button>
                <div>
                  <div className="text-[13.5px] font-medium">{dateLabel}</div>
                  <div className="text-[11px] text-muted-foreground">{dayAppts.length} appointments scheduled</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4"/></Button>
                {!isToday && <Button variant="outline" size="sm" onClick={() => setDate(new Date())} className="ml-2">Today</Button>}
              </div>
              <div className="flex gap-1.5">
                {(["scheduled","checked_in","in_progress","done","cancelled"] as const).map(s => {
                  const count = dayAppts.filter(a => a.status === s).length;
                  if (count === 0) return null;
                  const colors = { scheduled: "bg-muted", checked_in: "bg-amber-500/15 text-amber-700 dark:text-amber-300", in_progress: "bg-primary/15 text-primary", done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300" }[s];
                  return <span key={s} className={`text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${colors}`}>{count} {s.replace("_"," ")}</span>;
                })}
              </div>
            </div>

            <div className="divide-y divide-border">
              {dayAppts.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-[13px]">
                  <CalendarRange className="h-10 w-10 mx-auto opacity-40 mb-3"/>
                  No appointments scheduled for this day.
                </div>
              ) : dayAppts.map(a => {
                const p = PATIENTS.find(x => x.id === a.patientId)!;
                const d = DOCTORS.find(x => x.id === a.doctorId)!;
                const time = new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={a.id} className="grid grid-cols-[80px_36px_1fr_auto] gap-3 items-center px-4 py-2.5 hover-elevate">
                    <div className="text-[13px] tabular-nums font-mono text-muted-foreground">{time}</div>
                    <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center text-[10.5px] font-semibold text-primary">{a.token}</div>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-[10px] font-semibold">{p.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{p.fullName} <span className="text-muted-foreground font-normal">· {p.mrn}</span></div>
                        <div className="text-[11.5px] text-muted-foreground truncate">{a.reason} · {d.fullName} · <span className="capitalize">{a.channel.replace("_"," ")}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="capitalize text-[10px]">{a.status.replace("_"," ")}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MessageSquare className="h-3.5 w-3.5"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5"/></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Queue */}
        <TabsContent value="queue" className="mt-4">
          <Card className="p-6 border-card-border">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Live queue · {dateLabel}</div>
                <div className="text-[20px] font-semibold mt-0.5 tabular-nums">{queue.length} patients waiting</div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Clock className="h-3.5 w-3.5"/> Avg wait time: <span className="font-medium text-foreground">~14 min</span></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {queue.map(a => {
                const p = PATIENTS.find(x => x.id === a.patientId)!;
                const d = DOCTORS.find(x => x.id === a.doctorId)!;
                const time = new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <Card key={a.id} className="p-4 border-card-border">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-semibold text-primary tabular-nums">#{a.token}</div>
                      <Badge variant="outline" className="capitalize text-[10px]">{a.status.replace("_"," ")}</Badge>
                    </div>
                    <div className="mt-2 text-[13px] font-medium truncate">{p.fullName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.reason}</div>
                    <div className="mt-3 pt-3 border-t border-border text-[11.5px] text-muted-foreground flex items-center justify-between">
                      <span>{d.fullName}</span>
                      <span className="font-mono">{time}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Week */}
        <TabsContent value="week" className="mt-4">
          <Card className="border-card-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/40">
                  <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5">Date</th>
                    <th className="text-left font-medium px-4 py-2.5">Time</th>
                    <th className="text-left font-medium px-4 py-2.5">Patient</th>
                    <th className="text-left font-medium px-4 py-2.5">Doctor</th>
                    <th className="text-left font-medium px-4 py-2.5">Reason</th>
                    <th className="text-left font-medium px-4 py-2.5">Channel</th>
                    <th className="text-left font-medium px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingWeek.map(a => {
                    const p = PATIENTS.find(x => x.id === a.patientId)!;
                    const d = DOCTORS.find(x => x.id === a.doctorId)!;
                    return (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2.5 tabular-nums font-mono text-muted-foreground">{new Date(a.scheduledAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 tabular-nums font-mono">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-4 py-2.5 font-medium">{p.fullName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.fullName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.reason}</td>
                        <td className="px-4 py-2.5 text-muted-foreground capitalize">{a.channel.replace("_"," ")}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className="capitalize text-[10px]">{a.status.replace("_"," ")}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
