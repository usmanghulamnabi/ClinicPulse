import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
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
import { CLINIC, BRANCHES } from "@/lib/demo-data";
import { Building2, Bell, CreditCard, Plug, Palette, ShieldCheck, Check } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifWA, setNotifWA] = useState(true);
  const [notifPush, setNotifPush] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your clinic, profile, branding, and integrations." />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="clinic" data-testid="tab-clinic">Clinic</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>How others see you across ClinicPulse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input defaultValue={user?.fullName ?? ""} data-testid="input-full-name"/>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email ?? ""} type="email" data-testid="input-email"/>
                </div>
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input defaultValue={user?.specialty ?? ""} data-testid="input-specialty"/>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="+92 300 1234567" data-testid="input-phone"/>
                </div>
              </div>
              <Separator/>
              <div className="space-y-2">
                <Label>Signature</Label>
                <div className="rounded-md border p-4 bg-muted/30">
                  <svg width="220" height="64" viewBox="0 0 220 64" className="text-foreground">
                    <path d="M10 40 Q 30 10, 50 40 T 90 40 T 130 40 T 170 40" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <text x="10" y="58" fontFamily="Inter" fontSize="11" fill="currentColor" opacity="0.7">{user?.fullName ?? "—"}</text>
                  </svg>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast({ title: "Profile saved", description: "Your changes have been applied (demo)." })} data-testid="button-save-profile">
                  <Check className="h-4 w-4 mr-2"/>Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Two-factor and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">TOTP via authenticator app</p>
                </div>
                <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3"/>Enabled</Badge>
              </div>
              <Separator/>
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

        <TabsContent value="clinic" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4"/>{CLINIC.name}</CardTitle>
              <CardDescription>Workspace · {CLINIC.plan} plan · {BRANCHES.length} branches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic name</Label>
                  <Input defaultValue={CLINIC.name} data-testid="input-clinic-name"/>
                </div>
                <div className="space-y-2">
                  <Label>Workspace slug</Label>
                  <Input defaultValue={CLINIC.slug} data-testid="input-slug"/>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input defaultValue="PKR (₨)" data-testid="input-currency"/>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input defaultValue="Asia/Karachi" data-testid="input-timezone"/>
                </div>
              </div>
              <Separator/>
              <div className="space-y-2">
                <Label>Branches</Label>
                <div className="space-y-2">
                  {BRANCHES.map(b => (
                    <div key={b.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.address} · {b.city}</p>
                      </div>
                      <Badge variant="outline">{b.phone}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4"/>Appearance</CardTitle>
              <CardDescription>Theme and density.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Theme</p>
                  <p className="text-xs text-muted-foreground">Currently {theme === "dark" ? "Dark" : "Light"} mode</p>
                </div>
                <Button variant="outline" onClick={toggle} data-testid="button-toggle-theme">
                  Switch to {theme === "dark" ? "Light" : "Dark"}
                </Button>
              </div>
              <Separator/>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Compact density</p>
                  <p className="text-xs text-muted-foreground">Tighten table rows and lists</p>
                </div>
                <Switch data-testid="switch-compact"/>
              </div>
              <Separator/>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Reduce motion</p>
                  <p className="text-xs text-muted-foreground">Disable transitions and animations</p>
                </div>
                <Switch data-testid="switch-motion"/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4"/>Channels</CardTitle>
              <CardDescription>Choose where ClinicPulse delivers alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Email", desc: "Daily digest + critical alerts", val: notifEmail, set: setNotifEmail, id: "email" },
                { label: "WhatsApp", desc: "Patient confirmations and reminders", val: notifWA, set: setNotifWA, id: "wa" },
                { label: "SMS", desc: "Fallback for SMS-only patients", val: notifSms, set: setNotifSms, id: "sms" },
                { label: "Push notifications", desc: "Browser push for staff devices", val: notifPush, set: setNotifPush, id: "push" },
              ].map(row => (
                <div key={row.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch checked={row.val} onCheckedChange={row.set} data-testid={`switch-${row.id}`}/>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4"/>Integrations</CardTitle>
              <CardDescription>Connect external services. None require real credentials in demo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "WhatsApp Business API", status: "Connected", desc: "Send appointment reminders" },
                { name: "SendGrid", status: "Connected", desc: "Transactional email" },
                { name: "Stripe", status: "Sandbox", desc: "Online payments + invoicing" },
                { name: "Google Calendar", status: "Not connected", desc: "Two-way appointment sync" },
                { name: "Postgres (Neon / Supabase)", status: "Demo data", desc: "Production datastore" },
                { name: "OpenAI", status: "Assistive demo", desc: "Used by AI Insights only" },
              ].map(i => (
                <div key={i.name} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                  <Badge variant={i.status === "Not connected" ? "outline" : "secondary"}>{i.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4"/>Subscription</CardTitle>
              <CardDescription>Current plan and seats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge>Pro plan</Badge>
                    <p className="mt-2 text-2xl font-semibold">₨ 24,900<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Renews on 1 June 2026 · 12 of 25 seats used</p>
                  </div>
                  <Button variant="outline" data-testid="button-manage-plan">Manage plan</Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent invoices</p>
                {[
                  { id: "INV-2026-04", date: "1 Apr 2026", amt: "₨ 24,900", status: "Paid" },
                  { id: "INV-2026-03", date: "1 Mar 2026", amt: "₨ 24,900", status: "Paid" },
                  { id: "INV-2026-02", date: "1 Feb 2026", amt: "₨ 24,900", status: "Paid" },
                ].map(inv => (
                  <div key={inv.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{inv.id}</span>
                    <span className="text-muted-foreground">{inv.date}</span>
                    <span>{inv.amt}</span>
                    <Badge variant="secondary">{inv.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
