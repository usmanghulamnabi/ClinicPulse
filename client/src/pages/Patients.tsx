import { useMemo, useState, useRef } from "react";
import { Link } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileDown, Phone, MapPin, ShieldAlert, Trash2 } from "lucide-react";
import { fmtRelative } from "@/lib/seed-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/lib/store";

export default function Patients() {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { patients, deletePatient, deletePatientsMany, addPatient } = useStore();
  const canDelete = user?.role === "admin";

  /* form refs for add patient */
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const allergiesRef = useRef<HTMLInputElement>(null);
  const [newGender, setNewGender] = useState<"M" | "F">("M");
  const [newBlood, setNewBlood] = useState("O+");

  const filtered = useMemo(() => patients.filter(p => {
    if (gender !== "all" && p.gender !== gender) return false;
    if (q && !(
      p.fullName.toLowerCase().includes(q.toLowerCase()) ||
      p.mrn.toLowerCase().includes(q.toLowerCase()) ||
      p.phone.includes(q)
    )) return false;
    return true;
  }), [patients, q, gender]);

  /* selection helpers */
  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const someSelected = filtered.some(p => selectedIds.has(p.id));
  const selectedCount = Array.from(selectedIds).filter(id => filtered.some(p => p.id === id)).length;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  /* single delete */
  const confirmSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    try {
      await deletePatient(singleDeleteTarget.id);
      toast({ title: "Patient deleted", description: `${singleDeleteTarget.name} and their prescriptions were removed.` });
      setSelectedIds(prev => { const n = new Set(prev); n.delete(singleDeleteTarget!.id); return n; });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove patient. Please try again.", variant: "destructive" });
    }
    setSingleDeleteTarget(null);
  };

  /* bulk delete */
  const selectedInView = filtered.filter(p => selectedIds.has(p.id));
  const confirmBulkDelete = async () => {
    const ids = selectedInView.map(p => p.id);
    const names = selectedInView.map(p => p.fullName).join(", ");
    try {
      await deletePatientsMany(ids);
      setSelectedIds(new Set());
      toast({
        title: `${ids.length} patient${ids.length > 1 ? "s" : ""} deleted`,
        description: `Removed: ${names}. Associated prescriptions were also deleted.`,
      });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove patients. Please try again.", variant: "destructive" });
    }
    setBulkDeleteOpen(false);
  };

  /* add patient */
  const handleAddPatient = async () => {
    const fullName = nameRef.current?.value.trim() ?? "";
    const age = parseInt(ageRef.current?.value ?? "0");
    const phone = phoneRef.current?.value.trim() ?? "";
    const address = addressRef.current?.value.trim() ?? "";
    const allergiesRaw = allergiesRef.current?.value.trim() ?? "";
    if (!fullName || !phone) {
      toast({ title: "Missing fields", description: "Full name and phone are required.", variant: "destructive" });
      return;
    }
    const allergies = allergiesRaw ? allergiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    try {
      const p = await addPatient({
        fullName, age: age || 30, gender: newGender,
        phone, email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
        address, bloodGroup: newBlood, allergies, chronic: [], vaccinations: [],
        branchId: 1, doctorId: 1,
        diagnosis: "New registration",
        notes: "",
        family: {},
      });
      toast({ title: "Patient registered", description: `${p.fullName} · ${p.mrn} created.` });
      setAddOpen(false);
    } catch {
      toast({ title: "Save failed", description: "Could not register patient. Please try again.", variant: "destructive" });
    }
  };

  return (
    <PageContainer>
      {/* Single delete confirm */}
      <AlertDialog open={!!singleDeleteTarget} onOpenChange={open => !open && setSingleDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{singleDeleteTarget?.name}</strong> and all associated prescriptions from the clinic records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSingleDelete} className="bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedInView.length} patient{selectedInView.length > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{selectedInView.map(p => p.fullName).join(", ")}</strong> and all associated prescriptions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-rose-600 hover:bg-rose-700">Delete all {selectedInView.length}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Patients"
        subtitle={`${patients.length} total · ${filtered.length} matching filters`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Export queued", description: "CSV will download shortly." })}>
              <FileDown className="h-4 w-4" /> Export
            </Button>
            {canDelete && selectedCount > 0 && (
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete {selectedCount} selected
              </Button>
            )}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                    <div><Label className="text-[12px]">Full name *</Label><Input className="mt-1" placeholder="Ali Hassan" ref={nameRef} /></div>
                    <div><Label className="text-[12px]">Age</Label><Input className="mt-1" type="number" placeholder="34" ref={ageRef} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Gender</Label>
                      <Select value={newGender} onValueChange={v => setNewGender(v as "M" | "F")}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[12px]">Phone *</Label><Input className="mt-1" placeholder="+92 300 1234567" ref={phoneRef} /></div>
                  </div>
                  <div><Label className="text-[12px]">Address</Label><Input className="mt-1" placeholder="Block C, Gulberg…" ref={addressRef} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Blood group</Label>
                      <Select value={newBlood} onValueChange={setNewBlood}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[12px]">Allergies</Label><Input className="mt-1" placeholder="Penicillin, Sulfa" ref={allergiesRef} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPatient}>Save patient</Button>
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
                {canDelete && (
                  <th className="px-4 py-2.5 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                      className={someSelected && !allSelected ? "data-[state=unchecked]:opacity-50" : ""}
                    />
                  </th>
                )}
                <th className="text-left font-medium px-4 py-2.5">Patient</th>
                <th className="text-left font-medium px-4 py-2.5">Contact</th>
                <th className="text-left font-medium px-4 py-2.5">Diagnosis</th>
                <th className="text-right font-medium px-4 py-2.5">Last visit</th>
                {canDelete && <th className="text-right font-medium px-4 py-2.5">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} className={`border-t border-border hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                    {canDelete && (
                      <td className="px-4 py-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.fullName}`}
                        />
                      </td>
                    )}
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
                          onClick={() => setSingleDeleteTarget({ id: p.id, name: p.fullName })}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 6 : 4} className="px-4 py-8 text-center text-muted-foreground text-[13px]">
                    No patients match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
