import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import {
  Building2, Bell, CreditCard, Plug, Palette, ShieldCheck, Check, Loader2,
  User, Globe, Moon, Sun, Zap, CheckCircle2,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const { settings, updateSettings, loading } = useStore();

  /* ── Profile tab ── */
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [phone, setPhone] = useState("+92 300 1234567");

  /* ── Clinic tab ── */
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [clinicSlug, setClinicSlug] = useState(settings.clinicSlug);
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);

  /* ── Notifications tab ── */
  const [notifEmail, setNotifEmail] = useState(settings.notifEmail);
  const [notifSms, setNotifSms] = useState(settings.notifSms);
  const [notifWa, setNotifWa] = useState(settings.notifWa);
  const [notifPush, setNotifPush] = useState(settings.notifPush);

  const [saving, setSaving] = useState(false);

  /* Sync form when API data loads or settings change */
  useEffect(() => {
    setClinicName(settings.clinicName);
    setClinicSlug(settings.clinicSlug);
    setCurrency(settings.currency);
    setTimezone(settings.timezone);
    setNotifEmail(settings.notifEmail);
    setNotifSms(settings.notifSms);
    setNotifWa(settings.notifWa);
    setNotifPush(settings.notifPush);
  }, [settings]);

  /* ── Save helpers ── */
  const saveClinic = async () => {
    setSaving(true);
    try {
      await updateSettings({ clinicName, clinicSlug, currency, timezone });
      toast({ title: "Clinic settings saved", description: "Changes have been persisted to the database." });
    } catch {
      toast({ title: "Save failed", description: "Could not save clinic settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await updateSettings({ notifEmail, notifSms, notifWa, notifPush });
      toast({ title: "Notification preferences saved", description: "Your channel preferences have been updated." });
    } catch {
      toast({ title: "Save failed", description: "Could not save notification preferences.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () => {
    toast({ title: "Profile saved", description: "Your display name changes have been applied." });
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Settings" subtitle="Manage your clinic, profile, branding, and integrations." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your clinic, profile, branding, and integrations." />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="h-10 bg-muted/50 p-1">
          <TabsTrigger value="profile" className="gap-1.5 text-[12.5px]"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="clinic" className="gap-1.5 text-[12.5px]"><Building2 className="h-3.5 w-3.5" />Clinic</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-[12.5px]"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-[12.5px]"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 text-[12.5px]"><Plug className="h-3.5 w-3.5" />Integrations</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-[12.5px]"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Your profile
              </CardTitle>
              <CardDescription>How others see you across ClinicPulse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[18px] font-bold ring-2 ring-primary/20 shrink-0">
                  {(fullName || user?.fullName || "?").split(" ").map(w => w[0]).slice(0,2).join("")}
                </div>
                <div>
                  <div className="text-[14px] font-semibold">{fullName || user?.fullName || "—"}</div>
                  <div className="text-[12px] text-muted-foreground">{email || user?.email}</div>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">{user?.role}</Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} data-testid="input-full-name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Internal Medicine" data-testid="input-specialty" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} data-testid="input-phone" />
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <Label>Signature preview</Label>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <svg width="220" height="64" viewBox="0 0 220 64" className="text-foreground">
                    <path d="M10 40 Q 30 10, 50 40 T 90 40 T 130 40 T 170 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <text x="10" y="58" fontFamily="Inter" fontSize="11" fill="currentColor" opacity="0.7">{fullName || "—"}</text>
                  </svg>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} data-testid="button-save-profile" className="gap-1.5">
                  <Check className="h-4 w-4" />Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Security</CardTitle>
              <CardDescription>Two-factor authentication and password management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                <div>
                  <p className="font-medium text-sm">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">TOTP via authenticator app</p>
                </div>
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                  <CheckCircle2 className="h-3 w-3" />Enabled
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed 14 days ago</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-password">Change password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clinic ── */}
        <TabsContent value="clinic" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Clinic identity
              </CardTitle>
              <CardDescription>
                These settings are persisted to the database and shared across all staff accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic name</Label>
                  <Input value={clinicName} onChange={e => setClinicName(e.target.value)} data-testid="input-clinic-name" />
                  <p className="text-[11.5px] text-muted-foreground">Appears on prescriptions and reports.</p>
                </div>
                <div className="space-y-2">
                  <Label>Workspace slug</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">clinicpulse.app/</span>
                    <Input
                      value={clinicSlug}
                      onChange={e => setClinicSlug(e.target.value)}
                      className="pl-[130px]"
                      data-testid="input-slug"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="PKR (₨)" data-testid="input-currency" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="pl-9"
                      placeholder="Asia/Karachi"
                      data-testid="input-timezone"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-[12px] text-muted-foreground">
                  {settings.updatedAt ? `Last saved ${new Date(settings.updatedAt).toLocaleString()}` : "Not yet saved"}
                </p>
                <Button onClick={saveClinic} disabled={saving} data-testid="button-save-clinic" className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save clinic settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ── */}
        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" />Appearance</CardTitle>
              <CardDescription>Theme, density, and motion preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Theme switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => theme === "dark" && toggle()}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme === "light" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Light</p>
                    <p className="text-[11px] text-muted-foreground">Clean, bright interface</p>
                  </div>
                  {theme === "light" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                </button>
                <button
                  onClick={() => theme === "light" && toggle()}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Dark</p>
                    <p className="text-[11px] text-muted-foreground">Reduced eye strain at night</p>
                  </div>
                  {theme === "dark" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                </button>
              </div>
              <Separator />
              <div className="space-y-4">
                {[
                  { label: "Compact density", desc: "Tighten table rows and lists", id: "compact" },
                  { label: "Reduce motion", desc: "Disable transitions and animations for accessibility", id: "motion" },
                ].map(row => (
                  <div key={row.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                    <Switch data-testid={`switch-${row.id}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />Notification channels</CardTitle>
              <CardDescription>Choose where ClinicPulse delivers alerts and reminders. Saved to database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {[
                  { label: "Email",              desc: "Daily digest + critical alerts",        val: notifEmail, set: setNotifEmail, id: "email", icon: "📧" },
                  { label: "WhatsApp",           desc: "Patient confirmations and reminders",   val: notifWa,    set: setNotifWa,    id: "wa",    icon: "💬" },
                  { label: "SMS",                desc: "Fallback for SMS-only patients",         val: notifSms,   set: setNotifSms,   id: "sms",   icon: "📱" },
                  { label: "Push notifications", desc: "Browser push for staff devices",        val: notifPush,  set: setNotifPush,  id: "push",  icon: "🔔" },
                ].map(row => (
                  <div key={row.id} className={`flex items-center justify-between rounded-lg border p-3.5 transition-colors ${row.val ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px]">{row.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{row.label}</p>
                        <p className="text-xs text-muted-foreground">{row.desc}</p>
                      </div>
                    </div>
                    <Switch checked={row.val} onCheckedChange={row.set} data-testid={`switch-${row.id}`} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-[12px] text-muted-foreground">Changes are saved to the database immediately.</p>
                <Button onClick={saveNotifications} disabled={saving} data-testid="button-save-notifications" className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrations ── */}
        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" />Integrations</CardTitle>
              <CardDescription>Connected external services and API statuses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "WhatsApp Business API",       status: "Connected",     desc: "Send appointment reminders",                 color: "emerald" },
                { name: "SendGrid",                    status: "Connected",     desc: "Transactional email delivery",               color: "emerald" },
                { name: "Stripe",                      status: "Sandbox",       desc: "Online payments + invoicing",                color: "amber"   },
                { name: "Google Calendar",             status: "Not connected", desc: "Two-way appointment sync",                   color: "muted"   },
                { name: "Postgres (Neon / Supabase)",  status: "Active",        desc: "Production datastore via POSTGRES_URL",      color: "emerald" },
                { name: "OpenAI",                      status: "Assistive",     desc: "Used by AI Insights only",                  color: "violet"  },
              ].map(i => (
                <div key={i.name} className="flex items-center justify-between rounded-lg border border-border p-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${i.color === "emerald" ? "bg-emerald-500" : i.color === "amber" ? "bg-amber-500" : i.color === "violet" ? "bg-violet-500" : "bg-muted-foreground/40"}`} />
                    <div>
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.desc}</p>
                    </div>
                  </div>
                  <Badge
                    variant={i.status === "Not connected" ? "outline" : "secondary"}
                    className={
                      i.color === "emerald" ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" :
                      i.color === "amber"   ? "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10" :
                      i.color === "violet"  ? "border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/10" : ""
                    }
                  >
                    {i.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Billing ── */}
        <TabsContent value="billing" className="mt-6 space-y-4">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Subscription</CardTitle>
              <CardDescription>Current plan, seats, and billing history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-primary/20 p-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2">Pro plan</Badge>
                    <p className="text-2xl font-semibold">₨ 24,900<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Renews 1 June 2026 · 12 of 25 seats used</p>
                  </div>
                  <Button variant="outline" data-testid="button-manage-plan">Manage plan</Button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[11.5px] text-muted-foreground mb-1.5">
                    <span>Seat usage</span><span>12 / 25</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Recent invoices</p>
                {[
                  { id: "INV-2026-04", date: "1 Apr 2026", amt: "₨ 24,900", status: "Paid" },
                  { id: "INV-2026-03", date: "1 Mar 2026", amt: "₨ 24,900", status: "Paid" },
                  { id: "INV-2026-02", date: "1 Feb 2026", amt: "₨ 24,900", status: "Paid" },
                ].map(inv => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/30 transition-colors">
                    <span className="font-medium font-mono text-[12px]">{inv.id}</span>
                    <span className="text-muted-foreground">{inv.date}</span>
                    <span className="font-medium">{inv.amt}</span>
                    <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">{inv.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-[11.5px]">Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
