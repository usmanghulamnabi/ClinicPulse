import { useRef, useState } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/lib/store";
import { CLINIC, AUDIT_LOG } from "@/lib/seed-data";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, LockKeyhole, Users, Pill, FileClock, AlertTriangle, ArrowRight,
  UserPlus, Stethoscope,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SPECIALTIES = [
  "Internal Medicine", "Cardiology", "Pediatrics", "Pulmonology", "Orthopedics",
  "Neurology", "Dermatology", "Gynecology", "Ophthalmology", "ENT", "General Practice",
];

const ADMIN_PERMISSIONS = [
  "Delete patient records after confirmation",
  "Delete medicines from inventory after confirmation",
  "Bulk delete patients and cascade to prescriptions",
  "Create and manage doctor profiles",
  "View audit and session activity",
  "Manage clinic settings and operational controls",
  "Export reports and backup-ready data",
];

export default function Admin() {
  const { user } = useAuth();
  const { patients, medicines, doctors, addDoctor } = useStore();
  const { toast } = useToast();

  const [specialty, setSpecialty] = useState("Internal Medicine");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);

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
    try {
      await addDoctor({ fullName, email, specialty, branchId: 1, initials, active: true, phone });
      toast({ title: "Doctor profile created", description: `${fullName} (${specialty}) added to the clinic.` });
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      setAddDoctorOpen(false);
    } catch {
      toast({ title: "Save failed", description: "Could not create doctor profile. Please try again.", variant: "destructive" });
    }
  };

  return (
    <PageContainer>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-card-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Elevated rights
            </CardTitle>
            <CardDescription>
              Admin-only actions are hidden from receptionist, pharmacist, and doctor roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ADMIN_PERMISSIONS.map(permission => (
              <div key={permission} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[13px]">{permission}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Admin</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" /> Current admin
            </CardTitle>
            <CardDescription>{user.fullName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge>Admin</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Clinic</span><span>{CLINIC.name}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        {[
          { label: "Patients", value: patients.length, icon: Users, href: "/patients" },
          { label: "Medicines", value: medicines.length, icon: Pill, href: "/inventory" },
          { label: "Doctors", value: doctors.length, icon: Stethoscope, href: "/admin" },
          { label: "Audit events", value: AUDIT_LOG.length, icon: FileClock, href: "/audit" },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <Card className="border-card-border hover-elevate cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <item.icon className="h-4 w-4 text-primary" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 text-xl font-semibold num">{item.value}</div>
                <div className="text-[12px] text-muted-foreground">{item.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Create Doctor Section */}
      <Card className="mt-4 border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Doctor profiles
              </CardTitle>
              <CardDescription>
                Create doctor accounts for the clinic. Doctors can then be assigned to patients and prescriptions.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setAddDoctorOpen(v => !v)}>
              <UserPlus className="h-4 w-4" /> {addDoctorOpen ? "Cancel" : "Add doctor"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addDoctorOpen && (
            <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-[13px] font-medium">New doctor profile</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label className="text-[12px]">Full name *</Label><Input className="mt-1" placeholder="Dr. Ayesha Tariq" ref={nameRef} /></div>
                <div><Label className="text-[12px]">Email *</Label><Input className="mt-1" type="email" placeholder="ayesha@clinicpulse.app" ref={emailRef} /></div>
                <div>
                  <Label className="text-[12px]">Specialty</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[12px]">Phone</Label><Input className="mt-1" placeholder="+92 300 1234567" ref={phoneRef} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddDoctor}>Create doctor profile</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {doctors.map(d => (
              <div key={d.id} className="flex items-center gap-3 rounded-md border border-border bg-muted/10 px-3 py-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-semibold shrink-0">
                  {d.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{d.fullName}</div>
                  <div className="text-[11px] text-muted-foreground">{d.specialty} · {d.email}</div>
                </div>
                <Badge variant={d.active ? "default" : "outline"} className="text-[10px]">
                  {d.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="text-[13px] text-muted-foreground italic">No doctors yet. Add one above.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" /> Destructive action policy
          </CardTitle>
          <CardDescription>
            Patient and medicine deletion requires confirmation. Deleting a patient also removes all associated prescriptions.
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
