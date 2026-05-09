import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PATIENTS, PRESCRIPTIONS, APPOINTMENTS, PAYMENTS, DOCTORS, fmtMoney } from "@/lib/demo-data";

const doctorName = (id: number) => DOCTORS.find(d => d.id === id)?.fullName ?? "Clinician";
import { Calendar, Pill, Receipt, Download, MessageSquare, Heart, Activity, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function PatientPortal() {
  // Pin first patient as the "logged-in" patient
  const me = PATIENTS[0];
  const myRx = PRESCRIPTIONS.filter(p => p.patientId === me.id).slice(0, 8);
  const myAppts = APPOINTMENTS
    .filter(a => a.patientId === me.id)
    .sort((a,b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 6);
  const myBills = PAYMENTS.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Portal"
        subtitle="A read-only preview of what your patients see when they log in."
        actions={
          <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3"/>Read-only preview</Badge>
        }
      />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {me.fullName.split(" ").map(n=>n[0]).slice(0,2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{me.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                MRN {me.mrn} · {me.gender} · {me.age} yrs · Blood {me.bloodGroup}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {me.allergies.map(a => <Badge key={a} variant="destructive" className="text-xs">Allergy: {a}</Badge>)}
                {me.chronic.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-message-clinic">
                <MessageSquare className="h-4 w-4 mr-2"/>Message clinic
              </Button>
              <Button size="sm" data-testid="button-book-appt">
                <Calendar className="h-4 w-4 mr-2"/>Book appointment
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last visit</p>
                <p className="font-semibold">3 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active prescriptions</p>
                <p className="font-semibold">{myRx.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next appointment</p>
                <p className="font-semibold">
                  {(() => { const next = myAppts.find(a => a.scheduledAt > Date.now()); return next ? new Date(next.scheduledAt).toLocaleDateString() : "—"; })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rx">
        <TabsList>
          <TabsTrigger value="rx" data-testid="tab-rx"><Pill className="h-3.5 w-3.5 mr-2"/>Prescriptions</TabsTrigger>
          <TabsTrigger value="appts" data-testid="tab-appts"><Calendar className="h-3.5 w-3.5 mr-2"/>Appointments</TabsTrigger>
          <TabsTrigger value="bills" data-testid="tab-bills"><Receipt className="h-3.5 w-3.5 mr-2"/>Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="rx" className="mt-4 space-y-2">
          {myRx.map(rx => (
            <Card key={rx.id}>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{rx.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rx.createdAt).toLocaleDateString()} · {rx.items.length} medicines · {doctorName(rx.doctorId)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/prescriptions/${rx.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-rx-${rx.id}`}>View</Button>
                  </Link>
                  <Button variant="ghost" size="icon" data-testid={`button-download-rx-${rx.id}`}>
                    <Download className="h-4 w-4"/>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appts" className="mt-4 space-y-2">
          {myAppts.map(a => (
            <Card key={a.id}>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.scheduledAt).toLocaleString()} · {doctorName(a.doctorId)}
                  </p>
                </div>
                <Badge variant={a.status === "done" ? "secondary" : a.status === "cancelled" ? "destructive" : "default"}>
                  {a.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bills" className="mt-4 space-y-2">
          {myBills.map(b => (
            <Card key={b.id}>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Invoice {b.invoiceNo}</p>
                  <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()} · {b.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmtMoney(b.amount)}</p>
                  <Badge variant={b.status === "paid" ? "secondary" : "outline"} className="text-xs mt-1">{b.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Privacy & access</CardTitle>
          <CardDescription>
            Your records are end-to-end encrypted at rest. ClinicPulse never shares your data with third parties without your explicit consent.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
