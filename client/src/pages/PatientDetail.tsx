import { useRoute, Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone, Mail, MapPin, Calendar, Pill, FileText, Activity, ShieldAlert,
  Stethoscope, Plus, Heart, AlertCircle, ArrowLeft, Download,
} from "lucide-react";
import { PATIENTS, DOCTORS, BRANCHES, PRESCRIPTIONS, MEDICINES, fmtRelative } from "@/lib/demo-data";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const id = parseInt(params?.id ?? "1");
  const p = PATIENTS.find(x => x.id === id) ?? PATIENTS[0];
  const doctor = DOCTORS.find(d => d.id === p.doctorId);
  const branch = BRANCHES.find(b => b.id === p.branchId);
  const rxs = PRESCRIPTIONS.filter(r => r.patientId === p.id);

  return (
    <PageContainer>
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
      </Link>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11"><AvatarFallback className="bg-primary/10 text-primary text-[14px] font-semibold">{p.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
            <div>
              <div className="text-xl font-semibold tracking-tight">{p.fullName}</div>
              <div className="text-[12px] text-muted-foreground tabular-nums font-mono mt-0.5">{p.mrn} · {p.gender} · {p.age}y · {p.bloodGroup}</div>
            </div>
          </div>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export</Button>
            <Link href={`/prescriptions/new?patientId=${p.id}`}>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New prescription</Button>
            </Link>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left summary column */}
        <div className="space-y-4">
          <Card className="p-5 border-card-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3">Contact</div>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {p.phone}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {p.email}</div>
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> <span className="text-muted-foreground">{p.address}</span></div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-border"><Stethoscope className="h-4 w-4 text-muted-foreground" /> {doctor?.fullName} · {doctor?.specialty}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Registered {fmtRelative(p.createdAt)}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {branch?.name} · {branch?.city}</div>
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Allergies & alerts
            </div>
            {p.allergies.length === 0 ? (
              <div className="text-[12.5px] text-muted-foreground italic">No known allergies</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {p.allergies.map(a => (
                  <Badge key={a} variant="outline" className="border-rose-500/30 text-rose-600 dark:text-rose-400 gap-1">
                    <AlertCircle className="h-3 w-3" /> {a}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-4 mb-2">Chronic conditions</div>
            {p.chronic.length === 0 ? (
              <div className="text-[12.5px] text-muted-foreground italic">None recorded</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {p.chronic.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            )}
          </Card>

          <Card className="p-5 border-card-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Vitals (latest)
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><div className="text-[11px] text-muted-foreground">Heart rate</div><div className="font-semibold num">{72 + (p.id % 10)} bpm</div></div>
              <div><div className="text-[11px] text-muted-foreground">Blood pressure</div><div className="font-semibold num">{110 + (p.id % 25)}/{70 + (p.id % 12)}</div></div>
              <div><div className="text-[11px] text-muted-foreground">SpO₂</div><div className="font-semibold num">{96 + (p.id % 4)}%</div></div>
              <div><div className="text-[11px] text-muted-foreground">Weight</div><div className="font-semibold num">{55 + (p.id % 35)} kg</div></div>
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3">Family & vaccinations</div>
            <div className="space-y-1.5 text-[13px]">
              {p.family.mother && <div>Mother: <span className="text-muted-foreground">{p.family.mother}</span></div>}
              {p.family.father && <div>Father: <span className="text-muted-foreground">{p.family.father}</span></div>}
              {p.family.siblings && <div>Siblings: <span className="text-muted-foreground">{p.family.siblings}</span></div>}
              <div className="pt-2 border-t border-border">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Vaccines</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.vaccinations.map(v => <Badge key={v} variant="outline">{v}</Badge>)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right tabs */}
        <div className="lg:col-span-2">
          <Card className="border-card-border">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-12 px-3">
                <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Visit timeline</TabsTrigger>
                <TabsTrigger value="prescriptions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Prescriptions ({rxs.length})</TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Reports</TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">SOAP notes</TabsTrigger>
              </TabsList>

              {/* Timeline */}
              <TabsContent value="timeline" className="p-5">
                <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-border">
                  {p.visits.map(v => {
                    const d = DOCTORS.find(x => x.id === v.doctorId);
                    return (
                      <div key={v.id} className="relative">
                        <span className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex items-center gap-2">
                          <div className="text-[13px] font-medium">{v.diagnosis}</div>
                          <Badge variant="secondary" className="text-[10px]">{new Date(v.date).toLocaleDateString()}</Badge>
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">{d?.fullName} · {d?.specialty}</div>
                        <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[12px]">
                          <div className="rounded-md border border-border p-2.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Subjective</div>{v.soap.s}</div>
                          <div className="rounded-md border border-border p-2.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Objective</div>{v.soap.o}</div>
                          <div className="rounded-md border border-border p-2.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Assessment</div>{v.soap.a}</div>
                          <div className="rounded-md border border-border p-2.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Plan</div>{v.soap.p}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Prescriptions */}
              <TabsContent value="prescriptions" className="p-5">
                {rxs.length === 0 ? (
                  <div className="text-[13px] text-muted-foreground italic">No prescriptions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {rxs.map(r => (
                      <Link key={r.id} href={`/prescriptions/${r.id}`} className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate">
                        <Pill className="h-4 w-4 text-primary" />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium">{r.diagnosis}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {r.items.length} medicines · {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-auto capitalize">{r.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reports */}
              <TabsContent value="reports" className="p-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { name: "CBC Panel", date: "Mar 12, 2025", flag: "Normal" },
                    { name: "HbA1c", date: "Feb 28, 2025", flag: "6.7% — borderline" },
                    { name: "Chest X-ray", date: "Jan 18, 2025", flag: "No active disease" },
                    { name: "Lipid Profile", date: "Dec 22, 2024", flag: "LDL elevated" },
                  ].map((r, i) => (
                    <div key={i} className="rounded-md border border-border p-3 hover-elevate">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div className="text-[13px] font-medium">{r.name}</div>
                        <Button variant="ghost" size="icon" className="ml-auto h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="text-[11.5px] text-muted-foreground mt-1">{r.date} · {r.flag}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* SOAP */}
              <TabsContent value="notes" className="p-5">
                <div className="text-[13px] text-muted-foreground mb-4">
                  SOAP notes are captured during each visit. View the timeline for details, or
                  start a new note from a scheduled appointment.
                </div>
                <Button size="sm" className="gap-1.5"><Activity className="h-4 w-4" /> Record new SOAP note</Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
