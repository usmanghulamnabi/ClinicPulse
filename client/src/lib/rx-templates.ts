/**
 * Common clinic prescription templates.
 *
 * Each template prefills the prescription builder. Clinicians can edit, add,
 * remove, or replace any line before saving \u2014 templates are starter scaffolds,
 * not protocols.
 *
 * ⚠ Clinical disclaimer (also surfaced in the UI):
 *   These templates are convenience starters for typical adult outpatient care.
 *   Always verify dose/frequency/duration against current local guidelines and
 *   the patient's allergies, comorbidities, weight, renal/hepatic function,
 *   pregnancy status, age, and concomitant medications before dispensing.
 *
 * Custom templates are persisted to the browser's localStorage (no DB schema
 * change required). Export + share via the prescription-as-template button.
 */

export type RxTemplateItem = {
  /** Brand name as appears in the inventory catalog (used to match medicineId). */
  medicine: string;
  /** Free-text dose, e.g. "500mg" or "1 tablet" or "5 ml". */
  dose: string;
  /** Frequency \u2014 numeric "1-0-1" style or shorthand like BD/TDS/HS/PRN/Q8H. */
  frequency: string;
  /** Duration in days. */
  duration: number;
  /** Free-text instructions to print on the prescription (e.g. "after meals"). */
  instructions?: string;
};

export type RxTemplate = {
  id: string;
  name: string;
  diagnosis: string;
  /** Compact category tag for the picker chip. */
  category?: "GP" | "Cardio" | "Endo" | "ENT" | "GI" | "Resp" | "Uro" | "Allergy" | "Pain" | "Hema";
  /** Optional clinician notes carried into the prescription notes field. */
  notes?: string;
  items: RxTemplateItem[];
};

export const BUILT_IN_RX_TEMPLATES: RxTemplate[] = [
  {
    id: "tpl-htn",
    name: "Hypertension",
    category: "Cardio",
    diagnosis: "Essential Hypertension",
    notes: "Lifestyle: salt restriction, brisk walk 30 min/day, weight management. Recheck BP in 2 weeks.",
    items: [
      { medicine: "Telmisartan 40mg", dose: "40mg", frequency: "1-0-0", duration: 30, instructions: "Morning, before breakfast" },
      { medicine: "Amlodipine 5mg",   dose: "5mg",  frequency: "1-0-0", duration: 30, instructions: "Morning" },
    ],
  },
  {
    id: "tpl-htn-stage2",
    name: "Hypertension (Stage 2)",
    category: "Cardio",
    diagnosis: "Stage 2 Hypertension",
    notes: "Confirm BP \u2265 160/100 on 2 readings. Order baseline ECG, RFTs, lipid profile.",
    items: [
      { medicine: "Telmisartan 40mg",  dose: "80mg", frequency: "1-0-0", duration: 30, instructions: "Morning" },
      { medicine: "Amlodipine 5mg",    dose: "10mg", frequency: "1-0-0", duration: 30, instructions: "Morning" },
      { medicine: "Atenolol 50mg",     dose: "25mg", frequency: "1-0-0", duration: 30, instructions: "Hold if pulse < 55" },
    ],
  },
  {
    id: "tpl-dm",
    name: "Type 2 Diabetes",
    category: "Endo",
    diagnosis: "T2DM follow-up",
    notes: "Diet counseling, foot care, HbA1c every 3 months.",
    items: [
      { medicine: "Metformin 500mg",   dose: "500mg", frequency: "1-0-1", duration: 30, instructions: "After meals" },
      { medicine: "Atorvastatin 20mg", dose: "20mg",  frequency: "0-0-1", duration: 30, instructions: "At night" },
    ],
  },
  {
    id: "tpl-dm-newdx",
    name: "T2DM \u2014 newly diagnosed",
    category: "Endo",
    diagnosis: "Newly diagnosed Type 2 Diabetes",
    notes: "Order HbA1c, lipids, RFTs, urine R/E. Glucometer training. Educate hypo symptoms.",
    items: [
      { medicine: "Metformin 500mg",   dose: "500mg", frequency: "1-0-1", duration: 30, instructions: "Start; uptitrate to 1g BID over 2 wks" },
      { medicine: "Aspirin 75mg",      dose: "75mg",  frequency: "1-0-0", duration: 30, instructions: "After breakfast" },
      { medicine: "Atorvastatin 20mg", dose: "20mg",  frequency: "0-0-1", duration: 30 },
    ],
  },
  {
    id: "tpl-uri",
    name: "URI / Common Cold",
    category: "ENT",
    diagnosis: "Acute viral upper respiratory infection",
    notes: "Symptomatic care. Antibiotics not indicated unless bacterial features develop. Return if fever > 3 days or worsens.",
    items: [
      { medicine: "Panadol Extra",    dose: "500mg", frequency: "1-1-1", duration: 5, instructions: "After meals" },
      { medicine: "Loratadine 10mg",  dose: "10mg",  frequency: "0-0-1", duration: 5, instructions: "At night" },
      { medicine: "Vitamin D3 5000IU", dose: "5000IU", frequency: "1-0-0", duration: 14 },
    ],
  },
  {
    id: "tpl-flu",
    name: "Flu / Influenza-like illness",
    category: "Resp",
    diagnosis: "Acute febrile respiratory illness",
    notes: "Hydration, rest, isolate from family. Reassess in 72 h.",
    items: [
      { medicine: "Panadol Extra",   dose: "500mg", frequency: "Q6H", duration: 5, instructions: "PRN fever > 38\u00b0C" },
      { medicine: "Cetirizine 10mg", dose: "10mg",  frequency: "0-0-1", duration: 5 },
      { medicine: "Vitamin D3 5000IU", dose: "5000IU", frequency: "1-0-0", duration: 7 },
    ],
  },
  {
    id: "tpl-asthma",
    name: "Asthma / Wheezing",
    category: "Resp",
    diagnosis: "Mild persistent asthma",
    notes: "Spacer technique demonstrated. Peak flow diary. Avoid triggers (dust, smoke, cold).",
    items: [
      { medicine: "Salbutamol Inhaler", dose: "100mcg", frequency: "PRN", duration: 30, instructions: "2 puffs PRN, max 4x/day" },
      { medicine: "Montelukast 10mg",   dose: "10mg",   frequency: "0-0-1", duration: 30, instructions: "At bedtime" },
    ],
  },
  {
    id: "tpl-gastroenteritis",
    name: "Gastroenteritis",
    category: "GI",
    diagnosis: "Acute gastroenteritis",
    notes: "Oral rehydration after each loose stool. Avoid antibiotics unless dysentery. Return if blood/mucus in stool or signs of dehydration.",
    items: [
      { medicine: "ORS Sachet",        dose: "1 sachet", frequency: "PRN", duration: 5, instructions: "After every loose stool" },
      { medicine: "Pantoprazole 40mg", dose: "40mg", frequency: "1-0-0", duration: 5, instructions: "Before breakfast" },
      { medicine: "Panadol Extra",     dose: "500mg", frequency: "Q8H", duration: 3, instructions: "PRN cramps/fever" },
    ],
  },
  {
    id: "tpl-uti",
    name: "UTI (uncomplicated)",
    category: "Uro",
    diagnosis: "Acute uncomplicated cystitis",
    notes: "Increase fluid intake. Send urine R/E and culture. Reassess after 3 days. Avoid in pregnancy without specialist input.",
    items: [
      { medicine: "Ciprofloxacin 500mg", dose: "500mg", frequency: "1-0-1", duration: 5, instructions: "Avoid antacids \u00b1 2 h" },
      { medicine: "Pantoprazole 40mg",   dose: "40mg",  frequency: "1-0-0", duration: 7, instructions: "Gastric protection" },
    ],
  },
  {
    id: "tpl-rhinitis",
    name: "Allergic Rhinitis",
    category: "Allergy",
    diagnosis: "Allergic rhinitis",
    notes: "Allergen avoidance. Saline nasal rinses. Reassess at 2 weeks.",
    items: [
      { medicine: "Loratadine 10mg",  dose: "10mg", frequency: "1-0-0", duration: 14, instructions: "Morning" },
      { medicine: "Montelukast 10mg", dose: "10mg", frequency: "0-0-1", duration: 14, instructions: "At night" },
    ],
  },
  {
    id: "tpl-fever-pain",
    name: "Fever / Body aches",
    category: "Pain",
    diagnosis: "Pyrexia with myalgia",
    notes: "Hydration. Reassess if fever > 3 days, or red-flag signs (rash, neck stiffness, breathing difficulty).",
    items: [
      { medicine: "Panadol Extra",    dose: "500mg", frequency: "Q6H", duration: 3, instructions: "PRN, max 8 tabs/day" },
      { medicine: "Ibuprofen 400mg",  dose: "400mg", frequency: "1-0-1", duration: 3, instructions: "After meals" },
    ],
  },
  {
    id: "tpl-anemia",
    name: "Iron-deficiency anemia",
    category: "Hema",
    diagnosis: "Iron-deficiency anemia",
    notes: "CBC, ferritin, peripheral smear. Investigate cause if non-menstrual. Recheck Hb in 4 weeks.",
    items: [
      { medicine: "Folic Acid 5mg",     dose: "5mg",   frequency: "1-0-0", duration: 30, instructions: "Empty stomach" },
      { medicine: "Vitamin D3 5000IU",  dose: "5000IU", frequency: "1-0-0", duration: 30 },
    ],
  },
  {
    id: "tpl-gerd",
    name: "GERD / Dyspepsia",
    category: "GI",
    diagnosis: "Gastro-esophageal reflux disease",
    notes: "Avoid late meals, caffeine, smoking. Head-end elevation. Reassess at 4 weeks.",
    items: [
      { medicine: "Omeprazole 40mg",   dose: "40mg", frequency: "1-0-0", duration: 28, instructions: "Before breakfast" },
      { medicine: "Pantoprazole 40mg", dose: "40mg", frequency: "0-0-1", duration: 14, instructions: "If breakthrough symptoms" },
    ],
  },
  {
    id: "tpl-bronchitis",
    name: "Acute bronchitis",
    category: "Resp",
    diagnosis: "Acute bronchitis",
    notes: "Mostly viral. Reassess at 5 days. Antibiotics only if bacterial signs (purulent sputum, focal signs).",
    items: [
      { medicine: "Azithromycin 500mg", dose: "500mg", frequency: "1-0-0", duration: 3, instructions: "Same time daily" },
      { medicine: "Salbutamol Inhaler", dose: "100mcg", frequency: "PRN", duration: 7, instructions: "PRN wheeze" },
      { medicine: "Panadol Extra",       dose: "500mg", frequency: "Q8H", duration: 5 },
    ],
  },
  {
    id: "tpl-tonsillitis",
    name: "Bacterial tonsillitis",
    category: "ENT",
    diagnosis: "Acute bacterial tonsillitis",
    notes: "Confirm Centor criteria \u2265 3. Throat swab if recurrent.",
    items: [
      { medicine: "Augmentin 625mg", dose: "625mg", frequency: "1-0-1", duration: 7, instructions: "After meals" },
      { medicine: "Panadol Extra",   dose: "500mg", frequency: "Q6H", duration: 5, instructions: "PRN sore throat" },
    ],
  },
];

export const RX_TEMPLATE_DISCLAIMER =
  "Templates are starter scaffolds. Verify dose, frequency, duration and any contraindications against the patient's allergies, comorbidities, weight, renal/hepatic function, pregnancy status, age, and concurrent medications before dispensing.";

/* \u2500\u2500 Custom-template persistence (browser-side, localStorage) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

const STORAGE_KEY = "cp_custom_rx_templates_v1";

export function loadCustomTemplates(): RxTemplate[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RxTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplates(list: RxTemplate[]) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Add or replace a custom template (matched by id). */
export function upsertCustomTemplate(tpl: RxTemplate): RxTemplate[] {
  const list = loadCustomTemplates();
  const idx = list.findIndex(t => t.id === tpl.id);
  const next = idx >= 0 ? list.map((t, i) => (i === idx ? tpl : t)) : [tpl, ...list];
  saveCustomTemplates(next);
  return next;
}

export function deleteCustomTemplate(id: string): RxTemplate[] {
  const list = loadCustomTemplates().filter(t => t.id !== id);
  saveCustomTemplates(list);
  return list;
}

export function getAllTemplates(): RxTemplate[] {
  return [...loadCustomTemplates(), ...BUILT_IN_RX_TEMPLATES];
}
