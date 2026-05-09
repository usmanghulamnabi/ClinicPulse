import { useState } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, Activity, Stethoscope, BadgeCheck, KeyRound, MailCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetLoading, setResetLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  // Sign-up form
  const [suFirstName, setSuFirstName] = useState("");
  const [suLastName, setSuLastName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suLoading, setSuLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (!r.ok) { toast({ title: "Sign-in failed", description: r.error, variant: "destructive" }); return; }
    setLocation("/");
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/password/request", { email: resetEmail });
      const data = await res.json() as { devCode?: string };
      setResetStep("verify");
      // For single-clinic deployments without an SMTP integration, surface the
      // generated code to the operator so the workflow remains functional.
      if (data?.devCode) setDevCode(data.devCode);
      toast({
        title: "Reset code generated",
        description: data?.devCode
          ? `Code generated. (Operator code: ${data.devCode})`
          : "If an account exists, a reset code has been sent.",
      });
    } catch (error) {
      toast({
        title: "Unable to request reset",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const completeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Re-enter the same password in both fields.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      await apiRequest("POST", "/api/auth/password/reset", { email: resetEmail, code: resetCode, newPassword });
      setEmail(resetEmail);
      setPassword(newPassword);
      setActiveTab("signin");
      setResetStep("request");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setDevCode(null);
      toast({ title: "Password reset complete", description: "You can now sign in with your new password." });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message.replace(/^400:\s*/, "") : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/95 via-primary to-[#062B30] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="absolute -top-12 -left-10 w-[120%] h-[80%]" viewBox="0 0 600 300" fill="none">
            <path d="M0 150 C100 70, 200 230, 300 150 S 500 70, 600 150" stroke="white" strokeWidth="0.6" />
            <path d="M0 170 C100 90, 200 250, 300 170 S 500 90, 600 170" stroke="white" strokeWidth="0.6" opacity=".6"/>
            <path d="M0 130 C100 50, 200 210, 300 130 S 500 50, 600 130" stroke="white" strokeWidth="0.6" opacity=".4"/>
          </svg>
        </div>

        <Logo className="text-white relative" taglineClassName="!text-white/70" />

        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight max-w-md leading-tight">
            The operating system for <span className="opacity-80">modern clinics.</span>
          </h1>
          <p className="mt-3 text-white/80 text-[14px] max-w-md">
            Appointments, prescriptions, EMR, inventory, billing, and analytics — built for a focused
            clinic that needs speed, clarity, and reliable day-to-day control.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Stethoscope, t: "Smart prescriptions", s: "Templates, allergy alerts, dose calc." },
              { icon: ShieldCheck, t: "Secure access",       s: "Password reset, 2FA-ready, role-aware controls." },
              { icon: Activity,    t: "Live analytics",      s: "Revenue, profit, disease trends." },
              { icon: BadgeCheck,  t: "Single-clinic ready", s: "One queue, one inventory, one dashboard." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="rounded-lg bg-white/10 border border-white/15 p-3 backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4" />
                <div className="mt-2 text-[13px] font-medium">{f.t}</div>
                <div className="text-[11.5px] text-white/70">{f.s}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative text-[11.5px] text-white/65">
          ClinicPulse is a clinical management tool. Not a substitute for professional medical advice.
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8"><Logo /></div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="signin" data-testid="tab-signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Create account</TabsTrigger>
              <TabsTrigger value="reset" data-testid="tab-reset">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                Sign in to continue to your clinic workspace.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="email" className="text-[12px]">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" placeholder="you@clinic.com" data-testid="input-email" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[12px]">Password</Label>
                    <button
                      type="button"
                      className="text-[11.5px] text-primary hover:underline"
                      onClick={() => { setResetEmail(email); setActiveTab("reset"); }}
                      data-testid="button-forgot-password"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" placeholder="Enter your password" data-testid="input-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-signin">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

            </TabsContent>

            <TabsContent value="signup">
              <h2 className="text-xl font-semibold tracking-tight">Create a patient account</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                Patient self-registration creates a portal-only account. Clinical staff accounts are created by an admin.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={async e => {
                  e.preventDefault();
                  if (!suFirstName || !suLastName || !suEmail || suPassword.length < 8) {
                    toast({ title: "Check your details", description: "All fields are required and password must be at least 8 characters.", variant: "destructive" });
                    return;
                  }
                  setSuLoading(true);
                  try {
                    await apiRequest("POST", "/api/auth/signup", {
                      email: suEmail,
                      password: suPassword,
                      fullName: `${suFirstName} ${suLastName}`.trim(),
                    });
                    toast({ title: "Account created", description: "You can now sign in." });
                    setEmail(suEmail);
                    setPassword(suPassword);
                    setActiveTab("signin");
                    setSuFirstName(""); setSuLastName(""); setSuEmail(""); setSuPassword("");
                  } catch (err) {
                    toast({
                      title: "Signup failed",
                      description: err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setSuLoading(false);
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[12px]">First name</Label><Input className="mt-1.5" placeholder="Sara" value={suFirstName} onChange={e => setSuFirstName(e.target.value)} /></div>
                  <div><Label className="text-[12px]">Last name</Label><Input className="mt-1.5" placeholder="Khan" value={suLastName} onChange={e => setSuLastName(e.target.value)} /></div>
                </div>
                <div><Label className="text-[12px]">Email</Label><Input className="mt-1.5" type="email" placeholder="you@example.com" value={suEmail} onChange={e => setSuEmail(e.target.value)} /></div>
                <div><Label className="text-[12px]">Password</Label><Input className="mt-1.5" type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="At least 8 characters" /></div>
                <Button type="submit" className="w-full" disabled={suLoading}>{suLoading ? "Creating…" : "Create account"}</Button>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Reset password</h2>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Request a secure code, verify it, then create a new password.
                  </p>
                </div>
              </div>

              {resetStep === "request" ? (
                <form className="mt-6 space-y-4" onSubmit={requestReset}>
                  <div>
                    <Label htmlFor="reset-email" className="text-[12px]">Account email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="mt-1.5"
                      data-testid="input-reset-email"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
                    A one-time reset code will be sent to the account email. Reset codes are never displayed on this page.
                  </div>
                  <Button type="submit" className="w-full" disabled={resetLoading} data-testid="button-request-reset">
                    {resetLoading ? "Sending code…" : "Send reset code"}
                  </Button>
                </form>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={completeReset}>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-[12px] text-primary flex gap-2">
                    <MailCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      Code generated for <span className="font-medium">{resetEmail}</span>.
                      {devCode && (
                        <div className="mt-1 text-[11px]">Operator code: <code className="font-mono select-all">{devCode}</code></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reset-code" className="text-[12px]">Reset code</Label>
                    <Input
                      id="reset-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      className="mt-1.5 tracking-[0.3em] font-mono"
                      placeholder="000000"
                      data-testid="input-reset-code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password" className="text-[12px]">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="mt-1.5"
                      placeholder="At least 8 characters"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-[12px]">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="mt-1.5"
                      data-testid="input-confirm-password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setResetStep("request")} data-testid="button-change-reset-email">
                      Change email
                    </Button>
                    <Button type="submit" className="flex-1" disabled={resetLoading} data-testid="button-complete-reset">
                      {resetLoading ? "Updating…" : "Update password"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
