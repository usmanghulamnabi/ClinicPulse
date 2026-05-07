import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/AuthProvider";
import { CLINIC, PATIENTS, MEDICINES, USERS, AUDIT_LOG } from "@/lib/demo-data";
import { ShieldCheck, LockKeyhole, Users, Pill, Database, Settings, FileClock, AlertTriangle, ArrowRight } from "lucide-react";

const ADMIN_PERMISSIONS = [
  "Delete patient records after confirmation",
  "Delete medicines from inventory after confirmation",
  "View audit and session activity",
  "Manage clinic settings and operational controls",
  "Export reports and backup-ready data",
];

export default function Admin() {
  const { user } = useAuth();

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
          { label: "Patients", value: PATIENTS.length, icon: Users, href: "/patients" },
          { label: "Medicines", value: MEDICINES.length, icon: Pill, href: "/inventory" },
          { label: "Users", value: USERS.length, icon: ShieldCheck, href: "/settings" },
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

      <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" /> Destructive action policy
          </CardTitle>
          <CardDescription>
            Patient and medicine deletion requires confirmation. In a full production backend, these actions should be logged and preferably soft-deleted.
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
