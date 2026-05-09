import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, ChevronLeft, ChevronRight, Clock, Bell, Pencil,
  CalendarRange, Trash2, CheckCircle2,
} from "lucide-react";
import { useStore, type Appointment } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const STATUSES: Appointment["status"][] = ["scheduled","checked_in","in_progress","done","cancelled"];
const CHANNELS: Appointment["channel"][] = ["walk_in","online","phone"];

function statusColor(s: Appointment["status"]) {
  switch (s) {
    case "scheduled":   return "bg-muted";
    case "checked_in":  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "in_progress": return "bg-primary/15 text-primary";
    case "done":        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "cancelled":   return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
}

export default function Appointments() {
  const { user } = useAuth();
  const {
    patients, doctors, appointments,
    addAppointment, updateAppointment, deleteAppointment,
  } = useStore();
  const { toast } = useToast();

  const [date, setDate] = useState(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for booking/editing
  const [fPatientId, setFPatientId] = useState<string>("");
  const [fDoctorId, setFDoctorId] = useState<string>("");
  const [fDate, setFDate] = useState<string>(() => {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  });
  const [fTime, setFTime] = useState<string>("09:00");
  const [fReason, setFReason] = useState<string>("Consultation");
  const [fChannel, setFChannel] = useState<Appointment["channel"]>("walk_in");
  const [fStatus, setFStatus] = useState<Appointment["status"]>("scheduled");

  const canModify = !!user && (user.role === "admin" || user.role === "receptionist" || user.role === "doctor");

  const dayAppts = useMemo(() => appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    return d.toDateString() === date.toDateString();
  }).sort((a, b) => a.scheduledAt - b.scheduledAt), [appointments, date]);

  const queue = dayAppts.filter(a => ["scheduled","checked_in","in_progress"].includes(a.status));
  const upcomingWeek = appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    const today = new Date();
    return d >= today && d <= new Date(today.getTime() + 7*86400_000);
  }).slice(0, 60);

  const shift = (n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d); };
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  const isToday = date.toDateString() === new Date().toDateString();

  const resetForm = () => {
    setFPatientId(patients[0]?.id ? String(patients[0].id) : "");
    setFDoctorId(doctors[0]?.id ? String(doctors[0].id) : "");
    setFDate(date.toISOString().slice(0, 10));
    setFTime("09:00");
    setFReason("Consultation");
    setFChannel("walk_in");
    setFStatus("scheduled");
  };

  const openBookDialog = () => {
    resetForm();
    setEditing(null);
    setBookingOpen(true);
  };

  const openEditDialog = (a: Appointment) => {
    setEditing(a);
    setFPatientId(a.patientId ? String(a.patientId) : "");
    setFDoctorId(a.doctorId ? String(a.doctorId) : "");
    const d = new Date(a.scheduledAt);
    setFDate(d.toISOString().slice(0, 10));
    setFTime(d.toTimeString().slice(0, 5));
    setFReason(a.reason);
    setFChannel(a.channel);
    setFStatus(a.status);
    setBookingOpen(true);
  };

  const handleSave = async () => {
    if (!fPatientId) {
      toast({ title: "Patient required", description: "Select a patient to book.", variant: "destructive" });
      return;
    }
    const [hh, mm] = fTime.split(":").map(n => parseInt(n));
    const dt = new Date(fDate + "T00:00:00");
    dt.setHours(hh || 9, mm || 0, 0, 0);
    setSaving(true);
    try {
      if (editing) {
        await updateAppointment(editing.id, {
          patientId: parseInt(fPatientId),
          doctorId: fDoctorId ? parseInt(fDoctorId) : null,
          scheduledAt: dt.getTime(),
          reason: fReason,
          channel: fChannel,
          status: fStatus,
        });
        toast({ title: "Appointment updated" });
      } else {
        // Compute next token for the day
        const sameDay = appointments.filter(a => new Date(a.scheduledAt).toDateString() === dt.toDateString());
        const token = sameDay.length > 0 ? Math.max(...sameDay.map(a => a.token)) + 1 : 1;
        await addAppointment({
          patientId: parseInt(fPatientId),
          doctorId: fDoctorId ? parseInt(fDoctorId) : null,
          branchId: 1,
          scheduledAt: dt.getTime(),
          status: fStatus,
          token,
          reason: fReason,
          channel: fChannel,
          notes: "",
        });
        toast({ title: "Appointment booked", description: `Token #${token} for ${fDate} at ${fTime}.` });
      }
      setBookingOpen(false);
      setEditing(null);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unable to save appointment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (a: Appointment, status: Appointment["status"]) => {
    try {
      await updateAppointment(a.id, { status });
      toast({ title: `Marked ${status.replace("_", " ")}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAppointment(deleting.id);
      toast({ title: "Appointment cancelled" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
    setDeleting(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        subtitle="Calendar, queue, and reminders for your clinic."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast({ title: "Reminders queued", description: `${dayAppts.length} reminders prepared for today's patients.` })}
              disabled={dayAppts.length === 0}
            >
              <Bell className="h-4 w-4"/> Send reminders
            </Button>
            {canModify && (
              <Button size="sm" className="gap-1.5" onClick={openBookDialog}>
                <Plus className="h-4 w-4"/> Book appointment
              </Button>
            )}
          </>
        }
      />

      {/* Booking / edit dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit appointment" : "Book appointment"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the schedule, status, or reason." : "Select a patient, doctor, and time to schedule."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-[12px]">Patient *</Label>
              <Select value={fPatientId} onValueChange={setFPatientId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.fullName} · {p.mrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">Doctor</Label>
              <Select value={fDoctorId} onValueChange={setFDoctorId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.fullName} · {d.specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">Date</Label>
                <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[12px]">Time</Label>
                <Input type="time" value={fTime} onChange={e => setFTime(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-[12px]">Reason</Label>
              <Input value={fReason} onChange={e => setFReason(e.target.value)} className="mt-1.5"
                placeholder="Consultation, follow-up, lab review…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">Channel</Label>
                <Select value={fChannel} onValueChange={v => setFChannel(v as Appointment["channel"])}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px]">Status</Label>
                <Select value={fStatus} onValueChange={v => setFStatus(v as Appointment["status"])}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : (editing ? "Save changes" : "Book appointment")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Trash2 className="h-4 w-4" /> Cancel appointment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the appointment from the schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <div className="flex gap-1.5 flex-wrap justify-end">
                {STATUSES.map(s => {
                  const count = dayAppts.filter(a => a.status === s).length;
                  if (count === 0) return null;
                  return <span key={s} className={`text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor(s)}`}>{count} {s.replace("_"," ")}</span>;
                })}
              </div>
            </div>

            <div className="divide-y divide-border">
              {dayAppts.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-[13px]">
                  <CalendarRange className="h-10 w-10 mx-auto opacity-40 mb-3"/>
                  No appointments scheduled for this day.
                  {canModify && (
                    <div className="mt-3"><Button size="sm" onClick={openBookDialog} className="gap-1.5"><Plus className="h-4 w-4"/> Book appointment</Button></div>
                  )}
                </div>
              ) : dayAppts.map(a => {
                const p = patients.find(x => x.id === a.patientId);
                const time = new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={a.id} className="grid grid-cols-[80px_36px_1fr_auto] gap-3 items-center px-4 py-2.5 hover-elevate">
                    <div className="text-[13px] tabular-nums font-mono text-muted-foreground">{time}</div>
                    <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center text-[10.5px] font-semibold text-primary">{a.token}</div>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-[10px] font-semibold">{(p?.fullName || "??").split(" ").map(s => s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{p?.fullName || "Unknown patient"} <span className="text-muted-foreground font-normal">· {p?.mrn || "—"}</span></div>
                        <div className="text-[11.5px] text-muted-foreground truncate">{a.reason} · <span className="capitalize">{a.channel.replace("_"," ")}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`capitalize text-[10px] ${statusColor(a.status)}`}>{a.status.replace("_"," ")}</Badge>
                      {canModify && a.status !== "done" && a.status !== "cancelled" && (
                        <>
                          {a.status === "scheduled" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleQuickStatus(a, "checked_in")}>
                              Check in
                            </Button>
                          )}
                          {a.status === "checked_in" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleQuickStatus(a, "in_progress")}>
                              Start
                            </Button>
                          )}
                          {a.status === "in_progress" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-emerald-700 dark:text-emerald-400" onClick={() => handleQuickStatus(a, "done")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Done
                            </Button>
                          )}
                        </>
                      )}
                      {canModify && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(a)} aria-label="Edit appointment">
                            <Pencil className="h-3.5 w-3.5"/>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => setDeleting(a)} aria-label="Cancel appointment">
                            <Trash2 className="h-3.5 w-3.5"/>
                          </Button>
                        </>
                      )}
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
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5"/> Next token: <span className="font-medium text-foreground">#{queue[0]?.token ?? "—"}</span>
              </div>
            </div>
            {queue.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-[13px]">
                <CalendarRange className="h-8 w-8 mx-auto opacity-40 mb-2"/>
                Queue is clear.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {queue.map(a => {
                  const p = patients.find(x => x.id === a.patientId);
                  const time = new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <Card key={a.id} className="p-4 border-card-border">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-semibold text-primary tabular-nums">#{a.token}</div>
                        <Badge variant="outline" className={`capitalize text-[10px] ${statusColor(a.status)}`}>{a.status.replace("_"," ")}</Badge>
                      </div>
                      <div className="mt-2 text-[13px] font-medium truncate">{p?.fullName || "Unknown patient"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.reason}</div>
                      <div className="mt-3 pt-3 border-t border-border text-[11.5px] text-muted-foreground flex items-center justify-between">
                        <span className="capitalize">{a.channel.replace("_"," ")}</span>
                        <span className="font-mono">{time}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
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
                    <th className="text-left font-medium px-4 py-2.5">Reason</th>
                    <th className="text-left font-medium px-4 py-2.5">Channel</th>
                    <th className="text-left font-medium px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingWeek.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No upcoming appointments in the next 7 days.</td></tr>
                  ) : upcomingWeek.map(a => {
                    const p = patients.find(x => x.id === a.patientId);
                    return (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2.5 tabular-nums font-mono text-muted-foreground">{new Date(a.scheduledAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 tabular-nums font-mono">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-4 py-2.5 font-medium">{p?.fullName || "Unknown"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.reason}</td>
                        <td className="px-4 py-2.5 text-muted-foreground capitalize">{a.channel.replace("_"," ")}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className={`capitalize text-[10px] ${statusColor(a.status)}`}>{a.status.replace("_"," ")}</Badge></td>
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
