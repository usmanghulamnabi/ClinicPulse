import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus, Trash2, Save, ArrowLeft, AlertTriangle, Sparkles, FlaskConical, Calculator,
  BookmarkPlus, FileText, Search, Loader2,
} from "lucide-react";
import { RX_TEMPLATES } from "@/lib/demo-data";
import { PEDIATRIC_DOSES, calculatePediatricDose } from "@/lib/pediatric-doses";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

type Item = { id: string; medicineId: number | null; dose: string; frequency: string; duration: number; qty: number; notes?: string };

const FREQS = ["1-0-0","0-1-0","0-0-1","1-0-1","1-1-1","1-1-1-1","PRN","STAT"];

/** Read ?patientId=N from the hash portion of the URL (hash routing). */
function getHashQueryParam(name: string): string | null {
  try {
    const hash = window.location.hash; // e.g. "#/prescriptions/new?patientId=3"
    const qIdx = hash.indexOf("?");
    if (qIdx === -1) return null;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    return params.get(name);
  } catch {
    return null;
  }
}

export default function PrescriptionBuilder() {
  const [, setLocation] = useLocation();
  const { patients: PATIENTS, medicines: MEDICINES, addPrescription, loading } = useStore();

  // Read patientId from hash query param (e.g. #/prescriptions/new?patientId=3)
  const urlPatientId = parseInt(getHashQueryParam("patientId") ?? "0") || 0;
  const defaultPatientId = urlPatientId || PATIENTS[0]?.id || 0;
  const [patientId, setPatientId] = useState<number>(defaultPatientId);
  const [diagnosis, setDiagnosis] = useState("Type 2 Diabetes follow-up");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: "1", medicineId: 3, dose: "500mg", frequency: "1-0-1", duration: 30, qty: 60 },
    { id: "2", medicineId: 7, dose: "20mg",  frequency: "0-0-1", duration: 30, qty: 30 },
  ]);
  const [doseDrugId, setDoseDrugId] = useState(PEDIATRIC_DOSES[0].id);
  const [doseVariantId, setDoseVariantId] = useState(PEDIATRIC_DOSES[0].variants[0].id);
  const [doseFormLabel, setDoseFormLabel] = useState(PEDIATRIC_DOSES[0].forms[0].label);
  const [doseWeight, setDoseWeight] = useState("12");
  const [doseAge, setDoseAge] = useState("3");
  const { toast } = useToast();

  const patient = PATIENTS.find(p => p.id === patientId);
  const doseRule = PEDIATRIC_DOSES.find(d => d.id === doseDrugId) ?? PEDIATRIC_DOSES[0];
  const doseVariant = doseRule.variants.find(v => v.id === doseVariantId) ?? doseRule.variants[0];
  const doseForm = doseRule.forms.find(f => f.label === doseFormLabel) ?? doseRule.forms[0];
  const doseResult = useMemo(() => calculatePediatricDose({
    rule: doseRule,
    variant: doseVariant,
    formulation: doseForm,
    weightKg: parseFloat(doseWeight),
    ageYears: parseFloat(doseAge),
  }), [doseAge, doseForm, doseRule, doseVariant, doseWeight]);

  const allergyConflicts = useMemo(() => {
    const conflicts: { item: Item; allergy: string }[] = [];
    for (const it of items) {
      const med = MEDICINES.find(m => m.id === it.medicineId);
      if (!med) continue;
      for (const a of (patient?.allergies ?? [])) {
        if (med.generic.toLowerCase().includes(a.toLowerCase()) || med.name.toLowerCase().includes(a.toLowerCase())) {
          conflicts.push({ item: it, allergy: a });
        }
      }
    }
    return conflicts;
  }, [items, patient]);

  const duplicates = useMemo(() => {
    const seen = new Map<number, number>();
    items.forEach(it => { if (it.medicineId) seen.set(it.medicineId, (seen.get(it.medicineId) ?? 0) + 1); });
    return Array.from(seen.entries()).filter(([, n]) => n > 1).map(([id]) => id);
  }, [items]);

  const total = items.reduce((s, it) => {
    const m = MEDICINES.find(x => x.id === it.medicineId);
    return s + (m ? m.sellingPrice * it.qty : 0);
  }, 0);

  const addItem = () => setItems(arr => [...arr, { id: String(Date.now()), medicineId: null, dose: "", frequency: "1-0-1", duration: 7, qty: 14 }]);
  const removeItem = (id: string) => setItems(arr => arr.filter(x => x.id !== id));
  const updateItem = (id: string, patch: Partial<Item>) => setItems(arr => arr.map(x => x.id === id ? { ...x, ...patch } : x));

  const changeDoseDrug = (id: string) => {
    const next = PEDIATRIC_DOSES.find(d => d.id === id) ?? PEDIATRIC_DOSES[0];
    setDoseDrugId(next.id);
    setDoseVariantId(next.variants[0].id);
    setDoseFormLabel(next.forms[0].label);
  };

  const recalcQty = (it: Item) => {
    const tabs = it.frequency.split("-").reduce((a,b) => a + (parseInt(b) || 0), 0) || 1;
    return tabs * it.duration;
  };

  const applyTemplate = (tplId: string) => {
    const tpl = RX_TEMPLATES.find(t => t.id === tplId)!;
    setDiagnosis(tpl.diagnosis);
    setItems(tpl.items.map((it, i) => {
      const med = MEDICINES.find(m => m.name === it.medicine);
      const tabs = it.frequency.split("-").reduce((a,b) => a + (parseInt(b) || 0), 0) || 1;
      return {
        id: String(i+1),
        medicineId: med?.id ?? null,
        dose: it.dose,
        frequency: it.frequency,
        duration: it.duration,
        qty: tabs * it.duration,
      };
    }));
    toast({ title: "Template applied", description: `${tpl.name} regimen loaded.` });
  };

  const addCalculatedDose = () => {
    if (doseResult.warnings.some(w => w.includes("valid"))) {
      toast({ title: "Dose needs patient details", description: "Enter a valid weight and age first.", variant: "destructive" });
      return;
    }

    const matchingMedicine = MEDICINES.find(m =>
      m.generic.toLowerCase().includes(doseRule.generic.toLowerCase().split(/[+/]/)[0].trim()) ||
      doseRule.generic.toLowerCase().includes(m.generic.toLowerCase().split(/[+/]/)[0].trim())
    );

    setItems(arr => [...arr, {
      id: String(Date.now()),
      medicineId: matchingMedicine?.id ?? null,
      dose: doseResult.prescriptionDose,
      frequency: doseResult.prescriptionFrequency,
      duration: doseRule.id === "zinc" ? 14 : doseRule.id.includes("azithromycin") ? 3 : 5,
      qty: Math.max(1, Math.ceil(doseResult.dosesPerDay * (doseRule.id === "zinc" ? 14 : doseRule.id.includes("azithromycin") ? 3 : 5))),
      notes: `${doseRule.drug} pediatric dose calculated from weight ${doseWeight} kg and age ${doseAge} years. Verify clinically.`,
    }]);

    toast({ title: "Calculated dose added", description: `${doseRule.drug}: ${doseResult.prescriptionDose} ${doseResult.frequency}.` });
  };

  // Show a loading state while store is bootstrapping from API
  if (loading && PATIENTS.length === 0) {
    return (
      <PageContainer>
        <Link href="/prescriptions" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link href="/prescriptions" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <PageHeader
        title="New prescription"
        subtitle="Build a smart prescription with allergy alerts, dose calculation, and templates."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><BookmarkPlus className="h-4 w-4"/> Save as template</Button>
            <Button size="sm" className="gap-1.5" onClick={async () => {
              const validItems = items.filter(it => it.medicineId !== null);
              if (validItems.length === 0) { toast({ title: "No medicines", description: "Add at least one medicine.", variant: "destructive" }); return; }
              try {
                const rx = await addPrescription({
                  patientId,
                  doctorId: patient?.doctorId ?? 1,
                  diagnosis,
                  status: "active",
                  items: validItems.map(it => ({ medicineId: it.medicineId!, dose: it.dose, frequency: it.frequency, duration: it.duration, qty: it.qty })),
                  total,
                });
                toast({ title: "Prescription saved", description: `Rx #${rx.id} created for ${patient?.fullName ?? "patient"}.` });
                setLocation("/prescriptions");
              } catch {
                toast({ title: "Save failed", description: "Could not save prescription. Please try again.", variant: "destructive" });
              }
            }}>
              <Save className="h-4 w-4"/> Save & Print
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Patient + diagnosis */}
          <Card className="p-5 border-card-border">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px]">Patient</Label>
                <Select value={String(patientId)} onValueChange={(v) => setPatientId(parseInt(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {PATIENTS.slice(0, 30).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.fullName} · {p.mrn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  {patient?.gender} · {patient?.age}y · {patient?.bloodGroup}
                  {(patient?.allergies?.length ?? 0) > 0 && (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400 ml-2">
                      Allergic: {patient?.allergies?.join(", ")}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-[12px]">Diagnosis</Label>
                <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="mt-1.5"/>
              </div>
            </div>
          </Card>

          {/* Items table */}
          <Card className="p-5 border-card-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-medium">Medications</div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addItem}><Plus className="h-3.5 w-3.5"/> Add row</Button>
            </div>

            {(allergyConflicts.length > 0 || duplicates.length > 0) && (
              <div className="space-y-2 mb-3">
                {allergyConflicts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] rounded-md border border-rose-500/30 bg-rose-500/8 text-rose-700 dark:text-rose-300 px-3 py-2">
                    <AlertTriangle className="h-4 w-4"/>
                    Allergy conflict: <span className="font-medium">{MEDICINES.find(m => m.id === c.item.medicineId)?.name}</span> — patient is allergic to {c.allergy}.
                  </div>
                ))}
                {duplicates.length > 0 && (
                  <div className="flex items-center gap-2 text-[12px] rounded-md border border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-300 px-3 py-2">
                    <AlertTriangle className="h-4 w-4"/> Duplicate medicine entries detected.
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[760px] px-2">
                <div className="grid grid-cols-[28px_2.4fr_0.7fr_0.9fr_0.6fr_0.6fr_28px] gap-2 px-2 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                  <div>#</div><div>Medicine</div><div>Dose</div><div>Frequency</div><div className="text-right">Days</div><div className="text-right">Qty</div><div></div>
                </div>
                {items.map((it, idx) => {
                  const med = MEDICINES.find(m => m.id === it.medicineId);
                  return (
                    <div key={it.id} className="grid grid-cols-[28px_2.4fr_0.7fr_0.9fr_0.6fr_0.6fr_28px] gap-2 px-2 py-2 items-center border-t border-border">
                      <div className="text-[12px] num text-muted-foreground">{idx+1}</div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-left rounded-md border border-input bg-background px-2.5 h-9 text-[12.5px] hover-elevate truncate">
                            {med ? <><span className="font-medium">{med.name}</span> <span className="text-muted-foreground">· {med.generic}</span></> : <span className="text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Search medicine…</span>}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0 w-[360px]">
                          <div className="p-2 border-b border-border">
                            <Input placeholder="Search by name or generic" className="h-8" autoFocus
                              onChange={() => { /* live filter handled by full picker below */ }}/>
                          </div>
                          <div className="max-h-[280px] overflow-y-auto">
                            {MEDICINES.slice(0, 20).map(m => (
                              <button key={m.id} onClick={() => updateItem(it.id, { medicineId: m.id })} className="w-full flex items-center justify-between text-left px-3 py-2 hover-elevate">
                                <div>
                                  <div className="text-[12.5px] font-medium">{m.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{m.generic} · {m.company}</div>
                                </div>
                                <div className="text-[11px] text-muted-foreground tabular-nums">stock {m.stock}</div>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input value={it.dose} onChange={e => updateItem(it.id, { dose: e.target.value })} placeholder="500mg" className="h-9 text-[12.5px]"/>
                      <Select value={it.frequency} onValueChange={(v) => { const newIt = { ...it, frequency: v }; updateItem(it.id, { frequency: v, qty: recalcQty(newIt) }); }}>
                        <SelectTrigger className="h-9 text-[12.5px] font-mono"><SelectValue/></SelectTrigger>
                        <SelectContent>{FREQS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" value={it.duration} onChange={e => { const dur = parseInt(e.target.value) || 0; const newIt = { ...it, duration: dur }; updateItem(it.id, { duration: dur, qty: recalcQty(newIt) }); }} className="h-9 text-right text-[12.5px] num"/>
                      <Input type="number" value={it.qty} onChange={e => updateItem(it.id, { qty: parseInt(e.target.value) || 0 })} className="h-9 text-right text-[12.5px] num"/>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeItem(it.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calculator className="h-3.5 w-3.5"/> Auto-calculated quantity from frequency × days
              </div>
              <div className="font-medium num">Estimate ≈ <span className="text-primary">₨ {total.toLocaleString()}</span></div>
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <Label className="text-[12px]">Doctor's notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Counseling on lifestyle modification, dietary advice, etc." className="mt-1.5 min-h-[100px]"/>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary"/>
              <div className="text-[13px] font-medium">Templates</div>
            </div>
            <div className="space-y-1.5">
              {RX_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)} className="w-full text-left px-3 py-2 rounded-md border border-border hover-elevate" data-testid={`template-${t.id}`}>
                  <div className="text-[12.5px] font-medium">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.items.length} medicines · {t.diagnosis}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary"/>
              <div className="text-[13px] font-medium">AI suggestions</div>
              <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-[10px]">AI</Badge>
            </div>
            <div className="space-y-2 text-[12.5px]">
              <div className="rounded-md border border-border p-2.5">
                <div className="font-medium">Add Aspirin 75mg</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Common in T2DM with cardiovascular risk factors.</div>
              </div>
              <div className="rounded-md border border-border p-2.5">
                <div className="font-medium">Consider HbA1c lab</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Last reading was 6 months ago.</div>
              </div>
            </div>
            <div className="mt-3 text-[10.5px] text-muted-foreground">
              AI assists clinicians; suggestions are not medical advice.
            </div>
          </Card>

          <Card className="p-5 border-card-border">
            <div className="flex items-start gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                <FlaskConical className="h-4 w-4"/>
              </div>
              <div>
                <div className="text-[13px] font-medium">Pediatric dose calculator</div>
                <div className="text-[11px] text-muted-foreground">Uses your uploaded pediatric dosage reference.</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px]">Medicine</Label>
                <Select value={doseDrugId} onValueChange={changeDoseDrug}>
                  <SelectTrigger className="mt-1.5 h-9 text-[12.5px]" data-testid="select-pediatric-drug"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PEDIATRIC_DOSES.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.drug} · {d.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Dose rule</Label>
                <Select value={doseVariant.id} onValueChange={setDoseVariantId}>
                  <SelectTrigger className="mt-1.5 h-9 text-[12.5px]" data-testid="select-pediatric-rule"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {doseRule.variants.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.label} · {v.frequency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Formulation</Label>
                <Select value={doseForm.label} onValueChange={setDoseFormLabel}>
                  <SelectTrigger className="mt-1.5 h-9 text-[12.5px]" data-testid="select-pediatric-formulation"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {doseRule.forms.map(f => (
                      <SelectItem key={f.label} value={f.label}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Weight (kg)</Label>
                  <Input className="h-8 mt-1" inputMode="decimal" value={doseWeight} onChange={e => setDoseWeight(e.target.value)} data-testid="input-pediatric-weight"/>
                </div>
                <div>
                  <Label className="text-[11px]">Age (years)</Label>
                  <Input className="h-8 mt-1" inputMode="decimal" value={doseAge} onChange={e => setDoseAge(e.target.value)} data-testid="input-pediatric-age"/>
                </div>
              </div>

              <div className="rounded-lg bg-primary/8 border border-primary/20 px-3 py-3 text-[12px] space-y-2" data-testid="result-pediatric-dose">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Per dose</span>
                  <span className="font-semibold num text-primary text-right">{doseResult.doseSummary}</span>
                </div>
                {doseResult.mlSummary && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Liquid volume</span>
                    <span className="font-semibold num text-primary text-right">{doseResult.mlSummary}</span>
                  </div>
                )}
                {doseResult.dailySummary && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Daily total</span>
                    <span className="num text-right">{doseResult.dailySummary}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium text-right">{doseResult.frequency}</span>
                </div>
              </div>

              {doseResult.warnings.length > 0 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11.5px] text-amber-700 dark:text-amber-300 space-y-1">
                  {doseResult.warnings.map(w => (
                    <div key={w} className="flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5"/>{w}</div>
                  ))}
                </div>
              )}

              <div className="text-[10.5px] text-muted-foreground leading-relaxed">
                {doseResult.notes[0]}
              </div>

              <Button variant="outline" className="w-full gap-1.5" onClick={addCalculatedDose} data-testid="button-add-calculated-dose">
                <Plus className="h-3.5 w-3.5"/> Add calculated dose
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
