export type DoseType = "mg_per_kg_day" | "mg_per_kg_dose" | "fixed";

export type PediatricFormulation = {
  label: string;
  mgPerMl?: number;
  note?: string;
};

export type PediatricDoseVariant = {
  id: string;
  label: string;
  doseType: DoseType;
  min: number;
  max?: number;
  frequency: string;
  dosesPerDay: number;
  fixedDose?: string;
  maxDailyMg?: number;
  maxDoseMg?: number;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  notes?: string[];
};

export type PediatricDoseRule = {
  id: string;
  drug: string;
  generic: string;
  category: string;
  brandExamples?: string;
  forms: PediatricFormulation[];
  variants: PediatricDoseVariant[];
  sourceNote: string;
};

export type PediatricCalculation = {
  doseSummary: string;
  dailySummary?: string;
  mlSummary?: string;
  frequency: string;
  formulation: string;
  notes: string[];
  warnings: string[];
  prescriptionDose: string;
  prescriptionFrequency: string;
  dosesPerDay: number;
};

const oralSource = "Based on the uploaded pediatric dosage reference sheet. Verify indication, age limits, renal/hepatic status, allergies, local guidelines, and final dose clinically.";

export const PEDIATRIC_DOSES: PediatricDoseRule[] = [
  {
    id: "paracetamol",
    drug: "Paracetamol",
    generic: "Paracetamol",
    category: "Analgesic / antipyretic",
    brandExamples: "Panadol, Calpol",
    forms: [
      { label: "120 mg/5 ml syrup", mgPerMl: 24 },
      { label: "160 mg/5 ml syrup", mgPerMl: 32 },
      { label: "250 mg/5 ml syrup", mgPerMl: 50 },
      { label: "80 mg/2.5 ml drops", mgPerMl: 32 },
    ],
    variants: [
      { id: "standard", label: "Fever/pain", doseType: "mg_per_kg_dose", min: 15, frequency: "Every 4-6 hours", dosesPerDay: 4, notes: ["Use the lowest effective frequency and avoid duplicate paracetamol products."] },
    ],
    sourceNote: oralSource,
  },
  {
    id: "ibuprofen",
    drug: "Ibuprofen",
    generic: "Ibuprofen",
    category: "NSAID",
    brandExamples: "Brufen",
    forms: [
      { label: "100 mg/5 ml syrup", mgPerMl: 20 },
      { label: "200 mg/5 ml syrup", mgPerMl: 40 },
    ],
    variants: [
      { id: "standard", label: "Fever/pain", doseType: "mg_per_kg_dose", min: 10, max: 15, frequency: "Every 6-8 hours", dosesPerDay: 3, notes: ["Avoid in dehydration, renal impairment, active GI bleeding, and NSAID allergy."] },
    ],
    sourceNote: oralSource,
  },
  {
    id: "amoxicillin",
    drug: "Amoxicillin",
    generic: "Amoxicillin",
    category: "Antibiotic",
    brandExamples: "Amoxil",
    forms: [
      { label: "125 mg/5 ml suspension", mgPerMl: 25 },
      { label: "250 mg/5 ml suspension", mgPerMl: 50 },
    ],
    variants: [
      { id: "standard", label: "Routine infection", doseType: "mg_per_kg_day", min: 50, frequency: "BD/TDS", dosesPerDay: 2, maxDailyMg: 1000 },
      { id: "tds", label: "Routine infection, TDS split", doseType: "mg_per_kg_day", min: 50, frequency: "TDS", dosesPerDay: 3, maxDailyMg: 1000 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "amox-clav",
    drug: "Amoxicillin + clavulanate",
    generic: "Amoxicillin/clavulanate",
    category: "Antibiotic",
    brandExamples: "Augmentin, Calamox",
    forms: [
      { label: "156 mg/5 ml suspension", mgPerMl: 31.2, note: "Total labeled strength per 5 ml" },
      { label: "312 mg/5 ml suspension", mgPerMl: 62.4, note: "Total labeled strength per 5 ml" },
      { label: "457 mg/5 ml suspension", mgPerMl: 91.4, note: "Total labeled strength per 5 ml" },
    ],
    variants: [
      { id: "standard", label: "Routine infection", doseType: "mg_per_kg_day", min: 30, max: 50, frequency: "BD/TDS", dosesPerDay: 2, notes: ["Many guidelines dose by the amoxicillin component, not total salt strength. Confirm formulation before prescribing."] },
    ],
    sourceNote: oralSource,
  },
  {
    id: "azithromycin",
    drug: "Azithromycin",
    generic: "Azithromycin",
    category: "Antibiotic",
    brandExamples: "Azit, Zeecin, Azomax",
    forms: [{ label: "200 mg/5 ml suspension", mgPerMl: 40 }],
    variants: [
      { id: "standard", label: "Respiratory/skin infection", doseType: "mg_per_kg_day", min: 12, max: 15, frequency: "OD", dosesPerDay: 1 },
      { id: "enteric", label: "Enteric dose", doseType: "mg_per_kg_day", min: 20, frequency: "OD", dosesPerDay: 1 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "clarithromycin",
    drug: "Clarithromycin",
    generic: "Clarithromycin",
    category: "Antibiotic",
    brandExamples: "Klaricid, Rithmo",
    forms: [
      { label: "125 mg/5 ml suspension", mgPerMl: 25 },
      { label: "250 mg/5 ml suspension", mgPerMl: 50 },
    ],
    variants: [
      { id: "standard", label: "Routine infection", doseType: "mg_per_kg_day", min: 15, frequency: "BD", dosesPerDay: 2, maxDailyMg: 1000 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "cefixime",
    drug: "Cefixime",
    generic: "Cefixime",
    category: "Antibiotic",
    brandExamples: "Cefspan",
    forms: [
      { label: "100 mg/5 ml suspension", mgPerMl: 20 },
      { label: "200 mg/5 ml suspension", mgPerMl: 40 },
      { label: "400 mg/5 ml suspension", mgPerMl: 80 },
    ],
    variants: [
      { id: "standard", label: "Routine infection", doseType: "mg_per_kg_day", min: 10, frequency: "BD", dosesPerDay: 2 },
      { id: "enteric", label: "Enteric fever", doseType: "mg_per_kg_day", min: 20, frequency: "BD", dosesPerDay: 2 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "cefuroxime",
    drug: "Cefuroxime",
    generic: "Cefuroxime",
    category: "Antibiotic",
    brandExamples: "Zinnat",
    forms: [{ label: "125 mg/5 ml suspension", mgPerMl: 25 }],
    variants: [
      { id: "standard", label: "Routine infection", doseType: "mg_per_kg_day", min: 20, max: 30, frequency: "BD", dosesPerDay: 2 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "metronidazole",
    drug: "Metronidazole",
    generic: "Metronidazole",
    category: "Antibiotic / antiprotozoal",
    brandExamples: "Flagyl",
    forms: [
      { label: "100 mg/5 ml suspension", mgPerMl: 20 },
      { label: "200 mg/5 ml suspension", mgPerMl: 40 },
    ],
    variants: [
      { id: "standard", label: "Anaerobic/protozoal infection", doseType: "mg_per_kg_day", min: 20, max: 30, frequency: "BD/TDS", dosesPerDay: 3 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "ondansetron",
    drug: "Ondansetron",
    generic: "Ondansetron",
    category: "Antiemetic",
    brandExamples: "Onset, Zofran",
    forms: [{ label: "Tablet/ODT or injection reference", note: "No syrup concentration listed in reference sheet" }],
    variants: [
      { id: "standard", label: "Vomiting", doseType: "mg_per_kg_dose", min: 0.2, max: 0.3, frequency: "BD/TDS", dosesPerDay: 2 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "cetirizine",
    drug: "Cetirizine",
    generic: "Cetirizine",
    category: "Antihistamine",
    brandExamples: "Sedil",
    forms: [{ label: "5 mg/5 ml syrup", mgPerMl: 1 }],
    variants: [
      { id: "low", label: "Allergy, low dose", doseType: "mg_per_kg_dose", min: 2.5, frequency: "BD", dosesPerDay: 2, minAgeMonths: 6, notes: ["Reference lists 2.5-5 mg BD; this is a fixed dose selection, not weight-scaled."] },
      { id: "high", label: "Allergy, high dose", doseType: "mg_per_kg_dose", min: 5, frequency: "BD", dosesPerDay: 2, minAgeMonths: 6, notes: ["Reference lists 2.5-5 mg BD; this is a fixed dose selection, not weight-scaled."] },
    ],
    sourceNote: oralSource,
  },
  {
    id: "terbutaline",
    drug: "Terbutaline",
    generic: "Terbutaline",
    category: "Respiratory",
    brandExamples: "Britanyl",
    forms: [{ label: "0.3 mg/5 ml syrup", mgPerMl: 0.06 }],
    variants: [
      { id: "standard", label: "Bronchospasm", doseType: "mg_per_kg_dose", min: 0.05, max: 0.15, frequency: "Every 8 hours", dosesPerDay: 3 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "acefylline",
    drug: "Acefylline",
    generic: "Acefylline",
    category: "Respiratory",
    brandExamples: "Acefyl",
    forms: [{ label: "125 mg/5 ml syrup", mgPerMl: 25 }],
    variants: [
      { id: "standard", label: "Cough/bronchospasm adjunct", doseType: "mg_per_kg_dose", min: 10, frequency: "TDS", dosesPerDay: 3, minAgeMonths: 3 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "montelukast",
    drug: "Montelukast",
    generic: "Montelukast",
    category: "Respiratory",
    brandExamples: "Montelukast",
    forms: [{ label: "4 mg / 5 mg / 10 mg tablet or sachet" }],
    variants: [
      { id: "6m-5y", label: "6 months-5 years", doseType: "fixed", min: 0, frequency: "HS", dosesPerDay: 1, fixedDose: "4 mg at night", minAgeMonths: 6, maxAgeMonths: 71 },
      { id: "6-14y", label: "6-14 years", doseType: "fixed", min: 0, frequency: "HS", dosesPerDay: 1, fixedDose: "5 mg at night", minAgeMonths: 72, maxAgeMonths: 179 },
      { id: "15y-plus", label: "15 years and above", doseType: "fixed", min: 0, frequency: "HS", dosesPerDay: 1, fixedDose: "10 mg at night", minAgeMonths: 180 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "zinc",
    drug: "Zinc sulphate",
    generic: "Zinc sulphate",
    category: "GI / diarrhea adjunct",
    brandExamples: "Osiris, Zincat, DiaZinc",
    forms: [{ label: "20 mg/5 ml syrup", mgPerMl: 4 }],
    variants: [
      { id: "under-6m", label: "Under 6 months", doseType: "fixed", min: 0, frequency: "OD", dosesPerDay: 1, fixedDose: "2.5 ml (10 mg) once daily for 10-14 days", maxAgeMonths: 5 },
      { id: "over-6m", label: "6 months and above", doseType: "fixed", min: 0, frequency: "OD", dosesPerDay: 1, fixedDose: "5 ml (20 mg) once daily for 10-14 days", minAgeMonths: 6 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "fluconazole",
    drug: "Fluconazole",
    generic: "Fluconazole",
    category: "Antifungal",
    brandExamples: "Diflucan",
    forms: [{ label: "50 mg/5 ml suspension", mgPerMl: 10 }],
    variants: [
      { id: "loading", label: "Loading dose", doseType: "mg_per_kg_day", min: 25, frequency: "STAT/OD", dosesPerDay: 1 },
      { id: "daily", label: "Daily dose", doseType: "mg_per_kg_day", min: 12, frequency: "OD", dosesPerDay: 1 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "salbutamol-neb",
    drug: "Nebulized salbutamol",
    generic: "Salbutamol nebule",
    category: "Nebulization",
    brandExamples: "Neb. Salbutamol",
    forms: [{ label: "Nebulization volume reference" }],
    variants: [
      { id: "under-6m", label: "Under 6 months", doseType: "fixed", min: 0, frequency: "As clinically indicated", dosesPerDay: 1, fixedDose: "0.2 cc plus 2 cc normal saline", minAgeMonths: 2, maxAgeMonths: 5, notes: ["Reference lists use after 2 months. Monitor closely."] },
      { id: "6-12m", label: "6-12 months", doseType: "fixed", min: 0, frequency: "As clinically indicated", dosesPerDay: 1, fixedDose: "0.5 cc plus 2 cc normal saline", minAgeMonths: 6, maxAgeMonths: 12 },
      { id: "over-1y", label: "Over 1 year", doseType: "fixed", min: 0, frequency: "As clinically indicated", dosesPerDay: 1, fixedDose: "1 cc plus 2 cc normal saline", minAgeMonths: 13 },
    ],
    sourceNote: oralSource,
  },
  {
    id: "artemether-lumefantrine",
    drug: "Artemether + lumefantrine",
    generic: "Artemether/lumefantrine",
    category: "Anti-malarial",
    brandExamples: "Arceva, Arceva D/S",
    forms: [
      { label: "15/90 mg/5 ml syrup" },
      { label: "30/180 mg/5 ml D/S syrup" },
    ],
    variants: [
      { id: "weight-based", label: "Reference dose", doseType: "mg_per_kg_day", min: 1.2, frequency: "OD for 3 days", dosesPerDay: 1, notes: ["Reference D/S volume guide: 1-10 kg 5 ml, 11-15 kg 8.5 ml, 15-20 kg 12 ml. Confirm malaria protocol before prescribing."] },
    ],
    sourceNote: oralSource,
  },
];

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits).replace(/\.0$/, "");
};

const rangeText = (min: number, max?: number, unit = "mg") => {
  if (max === undefined || Math.abs(max - min) < 0.0001) return `${round(min)} ${unit}`;
  return `${round(min)}-${round(max)} ${unit}`;
};

const frequencyToRx = (frequency: string) => {
  const text = frequency.toLowerCase();
  if (text.includes("tds")) return "1-1-1";
  if (text.includes("bd")) return "1-0-1";
  if (text.includes("every 8")) return "1-1-1";
  if (text.includes("every 6") || text.includes("4-6")) return "1-1-1-1";
  if (text.includes("stat")) return "STAT";
  if (text.includes("hs")) return "0-0-1";
  if (text.includes("od")) return "0-0-1";
  return "PRN";
};

export function calculatePediatricDose(params: {
  rule: PediatricDoseRule;
  variant: PediatricDoseVariant;
  formulation: PediatricFormulation;
  weightKg: number;
  ageYears: number;
}): PediatricCalculation {
  const { rule, variant, formulation, weightKg, ageYears } = params;
  const warnings: string[] = [];
  const notes = [...(variant.notes ?? []), rule.sourceNote];
  const ageMonths = ageYears * 12;

  if (!Number.isFinite(weightKg) || weightKg <= 0) warnings.push("Enter a valid weight in kg.");
  if (!Number.isFinite(ageYears) || ageYears < 0) warnings.push("Enter a valid age.");
  if (variant.minAgeMonths !== undefined && ageMonths < variant.minAgeMonths) warnings.push(`Selected dose is for age ≥ ${round(variant.minAgeMonths / 12, 1)} years.`);
  if (variant.maxAgeMonths !== undefined && ageMonths > variant.maxAgeMonths) warnings.push(`Selected dose is for age ≤ ${round(variant.maxAgeMonths / 12, 1)} years.`);

  if (variant.doseType === "fixed") {
    const fixed = variant.fixedDose ?? "Use reference dose";
    return {
      doseSummary: fixed,
      frequency: variant.frequency,
      formulation: formulation.label,
      notes,
      warnings,
      prescriptionDose: fixed,
      prescriptionFrequency: frequencyToRx(variant.frequency),
      dosesPerDay: variant.dosesPerDay,
    };
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return {
      doseSummary: "Enter weight to calculate dose.",
      frequency: variant.frequency,
      formulation: formulation.label,
      notes,
      warnings,
      prescriptionDose: "",
      prescriptionFrequency: frequencyToRx(variant.frequency),
      dosesPerDay: variant.dosesPerDay,
    };
  }

  const max = variant.max ?? variant.min;
  let perDoseMin = 0;
  let perDoseMax = 0;
  let dailyMin = 0;
  let dailyMax = 0;

  if (variant.doseType === "mg_per_kg_day") {
    dailyMin = weightKg * variant.min;
    dailyMax = weightKg * max;
    if (variant.maxDailyMg !== undefined) {
      if (dailyMin > variant.maxDailyMg || dailyMax > variant.maxDailyMg) warnings.push(`Daily dose capped at ${variant.maxDailyMg} mg/day.`);
      dailyMin = Math.min(dailyMin, variant.maxDailyMg);
      dailyMax = Math.min(dailyMax, variant.maxDailyMg);
    }
    perDoseMin = dailyMin / variant.dosesPerDay;
    perDoseMax = dailyMax / variant.dosesPerDay;
  } else {
    perDoseMin = weightKg * variant.min;
    perDoseMax = weightKg * max;
    if (variant.maxDoseMg !== undefined) {
      if (perDoseMin > variant.maxDoseMg || perDoseMax > variant.maxDoseMg) warnings.push(`Per-dose amount capped at ${variant.maxDoseMg} mg/dose.`);
      perDoseMin = Math.min(perDoseMin, variant.maxDoseMg);
      perDoseMax = Math.min(perDoseMax, variant.maxDoseMg);
    }
    dailyMin = perDoseMin * variant.dosesPerDay;
    dailyMax = perDoseMax * variant.dosesPerDay;
  }

  const mlSummary = formulation.mgPerMl
    ? `${rangeText(perDoseMin / formulation.mgPerMl, perDoseMax / formulation.mgPerMl, "ml")} per dose`
    : undefined;

  if (formulation.note) notes.unshift(formulation.note);

  return {
    doseSummary: `${rangeText(perDoseMin, perDoseMax)} per dose`,
    dailySummary: `${rangeText(dailyMin, dailyMax)} per day`,
    mlSummary,
    frequency: variant.frequency,
    formulation: formulation.label,
    notes,
    warnings,
    prescriptionDose: mlSummary ?? `${rangeText(perDoseMin, perDoseMax)} per dose`,
    prescriptionFrequency: frequencyToRx(variant.frequency),
    dosesPerDay: variant.dosesPerDay,
  };
}
