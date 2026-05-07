import { useRef, useState } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/lib/store";
import { CLINIC, AUDIT_LOG } from "@/lib/seed-data";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, LockKeyhole, Users, Pill, FileClock, AlertTriangle, ArrowRight,
  UserPlus, Stethoscope, Trash2, Phone, Mail, ChevronDown, ChevronUp,
  CheckCircle2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SPECIALTIES = [
  "Internal Medicine", "Cardiology", "Pediatrics", "Pulmonology", "Orthopedics",
  "Neurology", "Dermatology", "Gynecology", "Ophthalmology", "ENT", "General Practice",
];

const ADMIN_PERMISSIONS = [
  { label: "Delete patient records after confirmation", icon: Users },
  { label: "Delete medicines from inventory after confirmation", icon: Pill },
  { label: "Bulk delete patients and cascade to prescriptions", icon: Users },
  { label: "Create and manage doctor profiles", icon: Stethoscope },
  { label: "Delete doctor profiles (patients/prescriptions show Unassigned)", icon: Stethoscope },
  { label: "View audit and session activity", icon: FileClock },
  { label: "Manage clinic settings and operational controls", icon: ShieldCheck },
  { label: "Export reports and backup-ready data", icon: FileClock },
];

export default function Admin() {
  const { user } = useAuth();
  const { patients, medicines, doctors, addDoctor, deleteDoctor, loading } = useStore();
  const { toast } = useToast();

  const [specialty, setSpecialty] = useState("Internal Medicine");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [deleteDoctorTarget, setDeleteDoctorTarget] = useState<{ id: number; fullName: string } | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  if (user?.role !== "admin") {
    return (
      <PageContainer>
        <Card className="max-w-2xl border-rose-500/30 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <LockKeyhole className="h-5 w-5" /> Admin access required
            </CardTitle>
            <CardDescription>
              This section contains elevated controls. Sign in with an admin account to continue.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  const handleAddDoctor = async () => {
    const fullName = nameRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    if (!fullName || !email) {
      toast({ title: "Missing fields", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    const initials = fullName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    setSavingDoctor(true);
    try {
      await addDoctor({ fullName, email, specialty, branchId: 1, initials, active: true, phone });
      toast({ title: "Doctor profile created", description: `${fullName} (${specialty}) added to the clinic.` });
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      setAddDoctorOpen(false);
    } catch {
      toast({ title: "Save failed", description: "Could not create doctor profile. Please try again.", variant: "destructive" });
    } finally {
      setSavingDoctor(false);
    }
  };

  const confirmDeleteDoctor = async () => {
    if (!deleteDoctorTarget) return;
    try {
      await deleteDoctor(deleteDoctorTarget.id);
      toast({
        title: "Doctor removed",
        description: `${deleteDoctorTarget.fullName} has been removed. Their patients and prescriptions now show 'Unassigned'.`,
      });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove doctor. Please try again.", variant: "destructive" });
    }
    setDeleteDoctorTarget(null);
  };

  return (
    <PageContainer>
      {/* Delete doctor confirm */}
      <AlertDialog open={!!deleteDoctorTarget} onOpenChange={open => !open && setDeleteDoctorTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Trash2 className="h-4 w-4" /> Remove doctor profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                You are about to permanently remove <strong>{deleteDoctorTarget?.fullName}</strong> from the clinic.
              </span>
              <span className="block mt-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-3 py-2 text-[12px]">
                ⚠ Patients and prescriptions assigned to this doctor will show <strong>Unassigned</strong> — they are not deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDoctor} className="bg-rose-600 hover:bg-rose-700">
              Remove doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Admin"
        subtitle={`Elevated controls for ${CLINIC.name}. Use these tools carefully.`}
        actions={
          <Link href="/audit">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileClock className="h-4 w-4" /> Audit log
            </Button>
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
        {[
          { label: "Patients", value: patients.length, icon: Users, href: "/patients", color: "text-blue-600 dark:text-blue-400" },
          { label: "Medicines", value: medicines.length, icon: Pill, href: "/inventory", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Doctors", value: doctors.length, icon: Stethoscope, href: "/admin", color: "text-violet-600 dark:text-violet-400" },
          { label: "Audit events", value: AUDIT_LOG.length, icon: FileClock, href: "/audit", color: "text-amber-600 dark:text-amber-400" },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <Card className="border-card-border hover-elevate cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-2xl font-semibold num">{item.value}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{item.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Doctor profiles — takes 3 cols */}
        <Card className="border-card-border lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Doctor profiles
                </CardTitle>
                <CardDescription>
                  {doctors.length} active · assign to patients and prescriptions.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={addDoctorOpen ? "outline" : "default"}
                className="gap-1.5"
                onClick={() => setAddDoctorOpen(v => !v)}
              >
                {addDoctorOpen ? (
                  <><ChevronUp className="h-4 w-4" /> Cancel</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Add doctor</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add doctor form */}
            {addDoctorOpen && (
              <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-[13px] font-semibold text-primary">New doctor profile</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Full name *</Label>
                    <Input className="mt-1" placeholder="Dr. Ayesha Tariq" ref={nameRef} />
                  </div>
                  <div>
                    <Label className="text-[12px]">Email *</Label>
                    <Input className="mt-1" type="email" placeholder="ayesha@clinicpulse.app" ref={emailRef} />
                  </div>
                  <div>
                    <Label className="text-[12px]">Specialty</Label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Phone</Label>
                    <Input className="mt-1" placeholder="+92 300 1234567" ref={phoneRef} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAddDoctor} disabled={savingDoctor}>
                    {savingDoctor ? "Saving…" : "Create profile"}
                  </Button>
                </div>
              </div>
            )}

            {/* Doctor list */}
            <div className="space-y-2">
              {loading && doctors.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-[13px]">Loading doctors…</div>
              ) : doctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Stethoscope className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-[13px] text-muted-foreground">No doctors yet.</p>
                  <p className="text-[11.5px] text-muted-foreground/70 mt-0.5">Add the first doctor profile above.</p>
                </div>
              ) : (
                doctors.map(d => (
                  <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 hover:bg-muted/30 transition-colors group">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0 ring-1 ring-primary/20">
                      {d.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{d.fullName}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{d.specialty}</span>
                        {d.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-2.5 w-2.5" />{d.email}
                          </span>
                        )}
                        {d.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />{d.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={d.active ? "default" : "outline"}
                      className={`text-[10px] shrink-0 ${d.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15" : ""}`}
                    >
                      {d.active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteDoctorTarget({ id: d.id, fullName: d.fullName })}
                      aria-label={`Remove ${d.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column — admin info + permissions */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-primary" /> Current admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[13px]">
                  {user.fullName.split(" ").map((w: string) => w[0]).slice(0,2).join("")}
                </div>
                <div>
                  <div className="text-[13px] font-medium">{user.fullName}</div>
                  <div className="text-[11.5px] text-muted-foreground">{user.email}</div>
                </div>
                <Badge className="ml-auto">Admin</Badge>
              </div>
              <div className="text-[12px] text-muted-foreground space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span>Clinic</span><span className="font-medium text-foreground">{CLINIC.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Elevated rights
              </CardTitle>
              <CardDescription>Admin-only actions, hidden from other roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ADMIN_PERMISSIONS.map(p => (
                <div key={p.label} className="flex items-start gap-2.5 text-[12.5px]">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{p.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Destructive actions quick-access */}
      <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" /> Destructive action policy
          </CardTitle>
          <CardDescription>
            Patient and medicine deletion requires confirmation. Deleting a patient removes all prescriptions.
            Deleting a doctor does <strong>not</strong> delete their patients or prescriptions — those show "Unassigned".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/patients">
              <Button variant="outline" className="w-full justify-between">
                Manage patient deletion <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full justify-between">
                Manage medicine deletion <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
