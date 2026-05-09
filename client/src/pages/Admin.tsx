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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/lib/store";
import { CLINIC } from "@/lib/seed-data";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, LockKeyhole, Users, Pill, FileClock, AlertTriangle, ArrowRight,
  UserPlus, Stethoscope, Trash2, Phone, Mail, ChevronUp,
  CheckCircle2, KeyRound, Copy, Check,
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
  { label: "Create and manage doctor profiles with login credentials", icon: Stethoscope },
  { label: "Reset any user's password", icon: KeyRound },
  { label: "Delete doctor profiles (patients/prescriptions show Unassigned)", icon: Stethoscope },
  { label: "View audit and session activity", icon: FileClock },
  { label: "Manage clinic settings and operational controls", icon: ShieldCheck },
];

export default function Admin() {
  const { user } = useAuth();
  const { patients, medicines, doctors, addDoctor, deleteDoctor, loading } = useStore();
  const { toast } = useToast();

  const [specialty, setSpecialty] = useState("Internal Medicine");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const customPwdRef = useRef<HTMLInputElement>(null);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [deleteDoctorTarget, setDeleteDoctorTarget] = useState<{ id: number; fullName: string; email: string } | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Result of doctor creation: shows temp password the admin must communicate to the doctor
  const [createdCreds, setCreatedCreds] = useState<{ email: string; tempPassword: string; fullName: string } | null>(null);
  const [credsCopied, setCredsCopied] = useState(false);

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState<{ email: string; fullName: string } | null>(null);
  const [resetCustomPwd, setResetCustomPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; tempPassword: string } | null>(null);

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
    const email = emailRef.current?.value.trim().toLowerCase() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    const customPwd = customPwdRef.current?.value ?? "";
    if (!fullName || !email) {
      toast({ title: "Missing fields", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    if (customPwd && customPwd.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters or leave blank to auto-generate.", variant: "destructive" });
      return;
    }
    const initials = fullName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    setSavingDoctor(true);
    try {
      const result = await addDoctor({
        fullName, email, specialty, branchId: 1, initials, active: true, phone,
        ...(customPwd ? { password: customPwd } : {}),
      });
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      if (customPwdRef.current) customPwdRef.current.value = "";
      setAddDoctorOpen(false);

      if (result.tempPassword) {
        setCreatedCreds({ email, tempPassword: result.tempPassword, fullName });
        setCredsCopied(false);
      } else {
        toast({
          title: "Doctor profile updated",
          description: `${fullName} linked to existing user account ${email}.`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create doctor profile.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
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
        description: `${deleteDoctorTarget.fullName} and the linked user account have been removed. Their patients and prescriptions now show 'Unassigned'.`,
      });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove doctor. Please try again.", variant: "destructive" });
    }
    setDeleteDoctorTarget(null);
  };

  const handleAdminReset = async () => {
    if (!resetTarget) return;
    if (resetCustomPwd && resetCustomPwd.length < 8) {
      toast({ title: "Password too short", description: "At least 8 characters required.", variant: "destructive" });
      return;
    }
    setResetting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/password/admin-reset", {
        email: resetTarget.email,
        ...(resetCustomPwd ? { newPassword: resetCustomPwd } : {}),
      });
      const data = await res.json() as { tempPassword: string; email: string };
      setResetResult({ email: data.email, tempPassword: data.tempPassword });
      setResetTarget(null);
      setResetCustomPwd("");
    } catch (e) {
      const msg = e instanceof Error ? e.message.replace(/^\d+:\s*/, "") : "Reset failed.";
      toast({ title: "Reset failed", description: msg, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const copyCreds = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCredsCopied(true);
      setTimeout(() => setCredsCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  return (
    <PageContainer>
      {/* Created doctor credentials dialog */}
      <Dialog open={!!createdCreds} onOpenChange={open => !open && setCreatedCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Doctor account created
            </DialogTitle>
            <DialogDescription>
              {createdCreds?.fullName} has been added with login credentials below. Share these securely with the doctor — they will be prompted to change the password on first sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email (sign-in)</Label>
              <div className="font-mono text-[13px] mt-1">{createdCreds?.email}</div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Temporary password</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono text-[13px] px-2 py-1.5 rounded bg-background border border-border flex-1 select-all">
                  {createdCreds?.tempPassword}
                </code>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => createdCreds && copyCreds(`${createdCreds.email} / ${createdCreds.tempPassword}`)}>
                  {credsCopied ? <><Check className="h-3.5 w-3.5"/> Copied</> : <><Copy className="h-3.5 w-3.5"/> Copy</>}
                </Button>
              </div>
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              This password is shown once. If lost, use the reset password action.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog (admin) */}
      <Dialog open={!!resetTarget} onOpenChange={open => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary"/> Reset password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.fullName}</strong> ({resetTarget?.email}). Leave blank to auto-generate a secure temporary password.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-[12px]">New password (optional)</Label>
            <Input className="mt-1.5" placeholder="Leave blank to auto-generate" value={resetCustomPwd}
                   onChange={e => setResetCustomPwd(e.target.value)} type="text" />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Minimum 8 characters. The user will be prompted to change it on next sign-in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleAdminReset} disabled={resetting}>{resetting ? "Resetting…" : "Reset password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset result dialog */}
      <Dialog open={!!resetResult} onOpenChange={open => !open && setResetResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600"/> Password reset
            </DialogTitle>
            <DialogDescription>
              Share this new password with the user securely. They will be prompted to change it on next sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="font-mono text-[13px] mt-1">{resetResult?.email}</div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">New password</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono text-[13px] px-2 py-1.5 rounded bg-background border border-border flex-1 select-all">
                  {resetResult?.tempPassword}
                </code>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => resetResult && copyCreds(`${resetResult.email} / ${resetResult.tempPassword}`)}>
                  <Copy className="h-3.5 w-3.5"/> Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete doctor confirm */}
      <AlertDialog open={!!deleteDoctorTarget} onOpenChange={open => !open && setDeleteDoctorTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Trash2 className="h-4 w-4" /> Remove doctor profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                You are about to permanently remove <strong>{deleteDoctorTarget?.fullName}</strong> and the linked user account.
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
          { label: "Users", value: doctors.length + 3, icon: Users, href: "/admin", color: "text-amber-600 dark:text-amber-400" },
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
        {/* Doctor profiles */}
        <Card className="border-card-border lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Doctor profiles & sign-ins
                </CardTitle>
                <CardDescription>
                  {doctors.length} active · creating a doctor also provisions a login account.
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
                    <Label className="text-[12px]">Email (sign-in) *</Label>
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
                  <div className="sm:col-span-2">
                    <Label className="text-[12px]">Password (optional)</Label>
                    <Input className="mt-1" placeholder="Leave blank to auto-generate" ref={customPwdRef} type="text" />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      If left blank, a secure 12-character password is generated and shown once after creation.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAddDoctor} disabled={savingDoctor}>
                    {savingDoctor ? "Saving…" : "Create profile + login"}
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
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
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
                    {d.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                        onClick={() => setResetTarget({ email: d.email, fullName: d.fullName })}
                        aria-label={`Reset password for ${d.fullName}`}
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteDoctorTarget({ id: d.id, fullName: d.fullName, email: d.email })}
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

        {/* Right column */}
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
                  {(user.fullName || "").split(" ").map((w: string) => w[0]).slice(0,2).join("")}
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
            Patient and medicine deletion requires confirmation. Deleting a patient cascades all prescriptions, appointments, and payments.
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
