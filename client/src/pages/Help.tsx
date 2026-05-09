import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard, BookOpen, MessageSquare, LifeBuoy } from "lucide-react";

const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ["⌘", "K"], desc: "Open command palette" },
  { keys: ["g", "d"], desc: "Go to Dashboard" },
  { keys: ["g", "p"], desc: "Go to Patients" },
  { keys: ["g", "r"], desc: "Go to Prescriptions" },
  { keys: ["g", "a"], desc: "Go to Appointments" },
  { keys: ["g", "i"], desc: "Go to Inventory" },
  { keys: ["g", "b"], desc: "Go to Billing" },
  { keys: ["g", "n"], desc: "Go to Analytics" },
  { keys: ["n"], desc: "New prescription" },
  { keys: ["?"], desc: "Show this help screen" },
  { keys: ["Esc"], desc: "Close any modal / dialog" },
];

const FAQS = [
  {
    q: "Is ClinicPulse a medical device?",
    a: "No. ClinicPulse is a clinic management SaaS. AI suggestions are assistive only — they do not replace clinical judgment.",
  },
  {
    q: "Where is patient data stored?",
    a: "Data is stored in your clinic workspace. The Vercel deployment uses in-memory state; connect a Postgres database via POSTGRES_URL for persistent storage.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Every list (patients, prescriptions, billing, inventory) supports CSV export, and prescriptions support PDF.",
  },
  {
    q: "Can I use this for one clinic only?",
    a: "Yes. This build is configured for a single clinic workspace with one queue, one inventory ledger, and one reporting dashboard.",
  },
  {
    q: "Which integrations are supported?",
    a: "WhatsApp Business, SendGrid email, Stripe payments, Google Calendar sync. Configure them under Settings → Integrations.",
  },
];

export default function Help() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Shortcuts"
        subtitle="Get productive fast. Keyboard-first design with thoughtful defaults."
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader>
            <BookOpen className="h-5 w-5 text-primary mb-2"/>
            <CardTitle className="text-base">Documentation</CardTitle>
            <CardDescription>Complete guides for every module.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover-elevate">
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-primary mb-2"/>
            <CardTitle className="text-base">Live chat</CardTitle>
            <CardDescription>Median response: under 4 minutes.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover-elevate">
          <CardHeader>
            <LifeBuoy className="h-5 w-5 text-primary mb-2"/>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>All systems operational.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-4 w-4"/>Keyboard shortcuts
          </CardTitle>
          <CardDescription>Type these from anywhere in the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map((k, j) => (
                    <kbd key={j} className="px-2 py-0.5 text-xs font-mono rounded border bg-muted">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently asked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQS.map((f, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-medium">{f.q}</p>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10">
        <CardContent className="pt-6">
          <Badge variant="outline" className="mb-2 border-amber-300">Important</Badge>
          <p className="text-sm">
            ClinicPulse is a productivity tool. AI features (insights, drug interactions, refill predictions, transcription) are <strong>assistive only</strong> and must not be used as the sole basis for clinical decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
