import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileDown, Phone, MapPin, ShieldAlert, Trash2 } from "lucide-react";
import { PATIENTS, fmtRelative } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

export default function Patients() {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<string>("all");
  const [patients, setPatients] = useState(PATIENTS);
  const { toast } = useToast();
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

  const filtered = useMemo(() => patients.filter(p => {
    if (gender !== "all" && p.gender !== gender) return false;
    if (q && !(p.fullName.toLowerCase().includes(q.toLowerCase()) || p.mrn.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q))) return false;
    return true;
  }), [patients, q, gender]);

  const deletePatient = (id: number, name: string) => {
    const ok = window.confirm(`Delete patient "${name}" from this clinic workspace? This demo action removes the record from the current app session.`);
    if (!ok) return;
    setPatients(current => current.filter(p => p.id !== id));
    toast({ title: "Patient deleted", description: `${name} was removed from the patient list.` });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} total · ${filtered.length} matching filters`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Export queued", description: "CSV will download shortly." })}>
              <FileDown className="h-4 w-4" /> Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-add-patient"><Plus className="h-4 w-4" /> New patient</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Register new patient</DialogTitle>
                  <DialogDescription>Add a patient record. MRN is auto-generated.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[12px]">Full name</Label><Input className="mt-1" placeholder="Ali Hassan" /></div>
                    <div><Label className="text-[12px]">Age</Label><Input className="mt-1" type="number" placeholder="34" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Gender</Label>
                      <Select defaultValue="M">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[12px]">Phone</Label><Input className="mt-1" placeholder="+92 300 1234567" /></div>
                  </div>
                  <div><Label className="text-[12px]">Address</Label><Input className="mt-1" placeholder="Block C, Gulberg…" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[12px]">Blood group</Label>
                      <Select defaultValue="O+">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[12px]">Allergies</Label><Input className="mt-1" placeholder="Penicillin, Sulfa" /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => toast({ title: "Patient saved", description: "MRN CP-2099 created." })}>Save patient</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card className="p-3 mb-4 border-card-border">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, MRN, or phone…"
              className="pl-8 h-9"
              value={q} onChange={e => setQ(e.target.value)}
              data-testid="input-search-patients"
            />
          </div>
          <div className="flex gap-2">
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genders</SelectItem>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-4 py-2.5">Patient</th>
                <th className="text-left font-medium px-4 py-2.5">Contact</th>
                <th className="text-left font-medium px-4 py-2.5">Diagnosis</th>
                <th className="text-right font-medium px-4 py-2.5">Last visit</th>
                {canDelete && <th className="text-right font-medium px-4 py-2.5">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(p => {
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3 group">
                        <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">{p.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <div className="font-medium group-hover:text-primary truncate">{p.fullName}</div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">{p.mrn} · {p.gender} · {p.age}y · {p.bloodGroup}</div>
                        </div>
                        {p.allergies.length > 0 && (
                          <Badge variant="outline" className="ml-2 gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px]">
                            <ShieldAlert className="h-3 w-3" /> Allergy
                          </Badge>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.phone}</div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-0.5"><MapPin className="h-3 w-3" /><span className="truncate max-w-[180px]">{p.address}</span></div>
                    </td>
                    <td className="px-4 py-2.5 truncate max-w-[180px]">{p.diagnosis}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{fmtRelative(p.lastVisitAt)}</td>
                    {canDelete && (
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => deletePatient(p.id, p.fullName)}
                          aria-label={`Delete ${p.fullName}`}
                          data-testid={`button-delete-patient-${p.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-4 py-3 border-t border-border text-[12px] text-muted-foreground text-center">
            Showing 50 of {filtered.length} · Refine search to narrow results
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
