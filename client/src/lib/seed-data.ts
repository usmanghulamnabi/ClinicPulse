/**
 * ClinicPulse seed data — 4 well-defined patients with consistent prescriptions.
 * Medicines catalog and doctors are also defined here.
 */

const today = new Date();
today.setHours(10, 0, 0, 0);
const day = 24 * 60 * 60 * 1000;
const ts = (daysAgo: number) => today.getTime() - daysAgo * day;

/* ── types ────────────────────────────────────────────────────────────────── */

export type Gender = "M" | "F";

export type Patient = {
  id: number;
  mrn: string;
  fullName: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  allergies: string[];
  chronic: string[];
  vaccinations: string[];
  branchId: number;
  doctorId: number;
  diagnosis: string;
  lastVisitAt: number;
  createdAt: number;
  notes: string;
  family: { mother?: string; father?: string; siblings?: string };
  visits: {
    id: number;
    date: number;
    doctorId: number;
    diagnosis: string;
    soap: { s: string; o: string; a: string; p: string };
  }[];
};

export type Medicine = {
  id: number;
  name: string;
  generic: string;
  company: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  lowStockAt: number;
  batchNo: string;
  expiry: number;
  barcode: string;
  sold30d: number;
};

export type Prescription = {
  id: number;
  patientId: number;
  doctorId: number;
  createdAt: number;
  diagnosis: string;
  status: "active" | "completed" | "cancelled";
  items: { medicineId: number; dose: string; frequency: string; duration: number; qty: number }[];
  total: number;
};

export type Doctor = {
  id: number;
  email: string;
  fullName: string;
  specialty: string;
  branchId: number;
  initials: string;
  active: boolean;
  phone?: string;
};

/* ── Doctors ─────────────────────────────────────────────────────────────── */

export const SEED_DOCTORS: Doctor[] = [
  { id: 1, email: "admin@clinicpulse.app",  fullName: "Dr. Muhammad Usman", specialty: "Internal Medicine", branchId: 1, initials: "MU", active: true, phone: "+92 300 1234501" },
  { id: 2, email: "doctor@clinicpulse.app", fullName: "Dr. Mahroona Laraib", specialty: "General Practice",  branchId: 1, initials: "ML", active: true, phone: "+92 300 1234502" },
];

/* ── Medicines ────────────────────────────────────────────────────────────── */

export const SEED_MEDICINES: Medicine[] = [
  { id: 1,  name: "Augmentin 625mg",     generic: "Amoxicillin/Clavulanate", company: "GSK",         unit: "tab",    purchasePrice: 18,  sellingPrice: 28,  stock: 32,  lowStockAt: 25, batchNo: "B2401", expiry: ts(-180 + 365), barcode: "849000000001", sold30d: 140 },
  { id: 2,  name: "Panadol Extra",        generic: "Paracetamol/Caffeine",   company: "GSK",         unit: "tab",    purchasePrice: 4,   sellingPrice: 7,   stock: 180, lowStockAt: 25, batchNo: "B2402", expiry: ts(-180 + 548), barcode: "849000000002", sold30d: 280 },
  { id: 3,  name: "Metformin 500mg",      generic: "Metformin",              company: "Searle",      unit: "tab",    purchasePrice: 3,   sellingPrice: 6,   stock: 240, lowStockAt: 25, batchNo: "B2403", expiry: ts(-180 + 480), barcode: "849000000003", sold30d: 220 },
  { id: 4,  name: "Glucophage XR 1g",    generic: "Metformin XR",           company: "Merck",       unit: "tab",    purchasePrice: 9,   sellingPrice: 15,  stock: 140, lowStockAt: 25, batchNo: "B2404", expiry: ts(-180 + 400), barcode: "849000000004", sold30d: 160 },
  { id: 5,  name: "Atenolol 50mg",        generic: "Atenolol",               company: "ICI",         unit: "tab",    purchasePrice: 5,   sellingPrice: 9,   stock: 220, lowStockAt: 25, batchNo: "B2405", expiry: ts(-180 + 365), barcode: "849000000005", sold30d: 180 },
  { id: 6,  name: "Telmisartan 40mg",     generic: "Telmisartan",            company: "Hilton",      unit: "tab",    purchasePrice: 12,  sellingPrice: 20,  stock: 160, lowStockAt: 25, batchNo: "B2406", expiry: ts(-180 + 450), barcode: "849000000006", sold30d: 130 },
  { id: 7,  name: "Atorvastatin 20mg",    generic: "Atorvastatin",           company: "Getz",        unit: "tab",    purchasePrice: 10,  sellingPrice: 16,  stock: 200, lowStockAt: 25, batchNo: "B2407", expiry: ts(-180 + 500), barcode: "849000000007", sold30d: 190 },
  { id: 8,  name: "Pantoprazole 40mg",    generic: "Pantoprazole",           company: "Searle",      unit: "tab",    purchasePrice: 6,   sellingPrice: 11,  stock: 260, lowStockAt: 25, batchNo: "B2408", expiry: ts(-180 + 360), barcode: "849000000008", sold30d: 210 },
  { id: 9,  name: "Salbutamol Inhaler",   generic: "Salbutamol",             company: "GSK",         unit: "unit",   purchasePrice: 240, sellingPrice: 360, stock: 42,  lowStockAt: 15, batchNo: "B2409", expiry: ts(-180 + 365), barcode: "849000000009", sold30d: 60 },
  { id: 10, name: "Montelukast 10mg",     generic: "Montelukast",            company: "Hilton",      unit: "tab",    purchasePrice: 14,  sellingPrice: 22,  stock: 90,  lowStockAt: 25, batchNo: "B2410", expiry: ts(-180 + 420), barcode: "849000000010", sold30d: 80 },
  { id: 11, name: "Cefixime 400mg",       generic: "Cefixime",               company: "Sami",        unit: "cap",    purchasePrice: 60,  sellingPrice: 95,  stock: 15,  lowStockAt: 25, batchNo: "B2411", expiry: ts(-180 + 280), barcode: "849000000011", sold30d: 45 },
  { id: 12, name: "Azithromycin 500mg",   generic: "Azithromycin",           company: "Pfizer",      unit: "tab",    purchasePrice: 55,  sellingPrice: 85,  stock: 12,  lowStockAt: 20, batchNo: "B2412", expiry: ts(-180 + 300), barcode: "849000000012", sold30d: 50 },
  { id: 13, name: "Ciprofloxacin 500mg",  generic: "Ciprofloxacin",          company: "Bayer",       unit: "tab",    purchasePrice: 18,  sellingPrice: 30,  stock: 80,  lowStockAt: 25, batchNo: "B2413", expiry: ts(-180 + 390), barcode: "849000000013", sold30d: 95 },
  { id: 14, name: "Loratadine 10mg",      generic: "Loratadine",             company: "Highnoon",    unit: "tab",    purchasePrice: 5,   sellingPrice: 9,   stock: 300, lowStockAt: 25, batchNo: "B2414", expiry: ts(-180 + 600), barcode: "849000000014", sold30d: 240 },
  { id: 15, name: "Ibuprofen 400mg",      generic: "Ibuprofen",              company: "Abbott",      unit: "tab",    purchasePrice: 4,   sellingPrice: 8,   stock: 180, lowStockAt: 25, batchNo: "B2415", expiry: ts(-180 + 520), barcode: "849000000015", sold30d: 200 },
  { id: 16, name: "ORS Sachet",           generic: "Oral Rehydration Salts", company: "Searle",      unit: "sachet", purchasePrice: 18,  sellingPrice: 30,  stock: 120, lowStockAt: 25, batchNo: "B2416", expiry: ts(-180 + 730), barcode: "849000000016", sold30d: 110 },
  { id: 17, name: "Insulin Mixtard 30",   generic: "Insulin Human",          company: "Novo Nordisk",unit: "unit",   purchasePrice: 520, sellingPrice: 720, stock: 18,  lowStockAt: 10, batchNo: "B2417", expiry: ts(-180 + 180), barcode: "849000000017", sold30d: 30 },
  { id: 18, name: "Levothyroxine 50mcg",  generic: "Levothyroxine",          company: "Searle",      unit: "tab",    purchasePrice: 5,   sellingPrice: 9,   stock: 140, lowStockAt: 25, batchNo: "B2418", expiry: ts(-180 + 365), barcode: "849000000018", sold30d: 120 },
  { id: 19, name: "Vitamin D3 5000IU",    generic: "Cholecalciferol",        company: "Pharmevo",    unit: "cap",    purchasePrice: 10,  sellingPrice: 18,  stock: 220, lowStockAt: 25, batchNo: "B2419", expiry: ts(-180 + 730), barcode: "849000000019", sold30d: 170 },
  { id: 20, name: "Folic Acid 5mg",       generic: "Folic Acid",             company: "Hilton",      unit: "tab",    purchasePrice: 2,   sellingPrice: 4,   stock: 400, lowStockAt: 30, batchNo: "B2420", expiry: ts(-180 + 730), barcode: "849000000020", sold30d: 190 },
  { id: 21, name: "Aspirin 75mg",         generic: "Aspirin",                company: "Bayer",       unit: "tab",    purchasePrice: 3,   sellingPrice: 6,   stock: 500, lowStockAt: 30, batchNo: "B2421", expiry: ts(-180 + 720), barcode: "849000000021", sold30d: 320 },
  { id: 22, name: "Omeprazole 40mg",      generic: "Omeprazole",             company: "Highnoon",    unit: "cap",    purchasePrice: 8,   sellingPrice: 14,  stock: 160, lowStockAt: 25, batchNo: "B2422", expiry: ts(-180 + 400), barcode: "849000000022", sold30d: 150 },
  { id: 23, name: "Diclofenac 50mg",      generic: "Diclofenac",             company: "Novartis",    unit: "tab",    purchasePrice: 5,   sellingPrice: 9,   stock: 90,  lowStockAt: 25, batchNo: "B2423", expiry: ts(-180 + 365), barcode: "849000000023", sold30d: 100 },
  { id: 24, name: "Cetirizine 10mg",      generic: "Cetirizine",             company: "Sanofi",      unit: "tab",    purchasePrice: 3,   sellingPrice: 6,   stock: 260, lowStockAt: 25, batchNo: "B2424", expiry: ts(-180 + 600), barcode: "849000000024", sold30d: 220 },
  { id: 25, name: "Amlodipine 5mg",       generic: "Amlodipine",             company: "Pfizer",      unit: "tab",    purchasePrice: 4,   sellingPrice: 8,   stock: 300, lowStockAt: 25, batchNo: "B2425", expiry: ts(-180 + 500), barcode: "849000000025", sold30d: 260 },
];

/* ── Patients (4 records) ─────────────────────────────────────────────────── */

export const SEED_PATIENTS: Patient[] = [
  {
    id: 1,
    mrn: "CP-2001",
    fullName: "Ali Hassan",
    age: 45,
    gender: "M",
    phone: "+92 300 1234567",
    email: "ali.hassan@mail.com",
    address: "14-B, Gulberg III, Lahore",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    chronic: ["Hypertension", "Type 2 Diabetes"],
    vaccinations: ["Hep B", "Influenza '24", "COVID-19 booster"],
    branchId: 1,
    doctorId: 2,
    diagnosis: "Hypertension follow-up",
    lastVisitAt: ts(3),
    createdAt: ts(420),
    notes: "Patient prefers morning appointments. Compliant with therapy.",
    family: { mother: "Hypertension", father: "Type 2 Diabetes" },
    visits: [
      {
        id: 1,
        date: ts(3),
        doctorId: 2,
        diagnosis: "Hypertension follow-up",
        soap: {
          s: "Patient reports occasional headache and fatigue for 4 days.",
          o: "BP 148/92 mmHg · HR 78 bpm · Temp 36.8°C · SpO₂ 98%",
          a: "Essential Hypertension — partially controlled",
          p: "Continued Telmisartan 40mg OD, Amlodipine 5mg OD. Follow-up in 14 days.",
        },
      },
      {
        id: 2,
        date: ts(33),
        doctorId: 2,
        diagnosis: "Type 2 DM follow-up",
        soap: {
          s: "Patient reports polyuria and increased thirst for 1 week.",
          o: "BP 142/88 mmHg · HR 76 bpm · FBS 178 mg/dL · HbA1c 7.2%",
          a: "Type 2 Diabetes — suboptimal control",
          p: "Increased Metformin 500mg to BID. Glucophage XR 1g OD added. Diet counselling given.",
        },
      },
    ],
  },
  {
    id: 2,
    mrn: "CP-2002",
    fullName: "Maryam Iqbal",
    age: 32,
    gender: "F",
    phone: "+92 321 9876543",
    email: "maryam.iqbal@mail.com",
    address: "7-C, DHA Phase 4, Karachi",
    bloodGroup: "A+",
    allergies: [],
    chronic: ["Asthma"],
    vaccinations: ["Hep B", "Tdap", "COVID-19 booster"],
    branchId: 1,
    doctorId: 2,
    diagnosis: "Asthma exacerbation",
    lastVisitAt: ts(7),
    createdAt: ts(200),
    notes: "",
    family: { mother: "Asthma" },
    visits: [
      {
        id: 1,
        date: ts(7),
        doctorId: 2,
        diagnosis: "Asthma exacerbation",
        soap: {
          s: "Patient reports wheezing and shortness of breath for 2 days, worse at night.",
          o: "BP 118/76 mmHg · HR 92 bpm · SpO₂ 94% · Peak flow 68% predicted",
          a: "Mild persistent asthma — acute exacerbation",
          p: "Salbutamol inhaler PRN. Montelukast 10mg OD added. Prednisolone 5-day course. Follow-up in 10 days.",
        },
      },
    ],
  },
  {
    id: 3,
    mrn: "CP-2003",
    fullName: "Hamza Khan",
    age: 58,
    gender: "M",
    phone: "+92 333 5556677",
    email: "hamza.khan@mail.com",
    address: "22-A, F-7 Markaz, Islamabad",
    bloodGroup: "B+",
    allergies: ["NSAIDs"],
    chronic: ["Hypertension", "Hyperlipidemia"],
    vaccinations: ["Hep B", "Influenza '24"],
    branchId: 1,
    doctorId: 2,
    diagnosis: "Cardiology follow-up",
    lastVisitAt: ts(12),
    createdAt: ts(600),
    notes: "Patient is a retired civil servant. Good compliance.",
    family: { father: "Hypertension", mother: "Hyperlipidemia" },
    visits: [
      {
        id: 1,
        date: ts(12),
        doctorId: 2,
        diagnosis: "Cardiology follow-up",
        soap: {
          s: "Patient reports mild chest tightness on exertion and dyspnoea on climbing stairs.",
          o: "BP 152/96 mmHg · HR 68 bpm · SpO₂ 97% · ECG: sinus rhythm",
          a: "Hypertension with hyperlipidemia — requires optimisation",
          p: "Atenolol 50mg OD continued. Atorvastatin 20mg added. Aspirin 75mg OD. Repeat lipid profile in 6 weeks.",
        },
      },
      {
        id: 2,
        date: ts(60),
        doctorId: 2,
        diagnosis: "Hypertension follow-up",
        soap: {
          s: "BP running high at home per patient log.",
          o: "BP 160/100 mmHg · HR 72 bpm",
          a: "Uncontrolled hypertension",
          p: "Amlodipine 5mg added. Lifestyle modifications advised.",
        },
      },
    ],
  },
  {
    id: 4,
    mrn: "CP-2004",
    fullName: "Sara Ahmed",
    age: 27,
    gender: "F",
    phone: "+92 312 3334455",
    email: "sara.ahmed@mail.com",
    address: "5-D, Bahria Town, Rawalpindi",
    bloodGroup: "AB-",
    allergies: ["Sulfa"],
    chronic: [],
    vaccinations: ["Hep B", "Tdap", "COVID-19 booster", "Influenza '24"],
    branchId: 1,
    doctorId: 1,
    diagnosis: "Acute viral URI",
    lastVisitAt: ts(1),
    createdAt: ts(30),
    notes: "",
    family: {},
    visits: [
      {
        id: 1,
        date: ts(1),
        doctorId: 1,
        diagnosis: "Acute viral URI",
        soap: {
          s: "Patient reports sore throat, runny nose, and mild fever for 3 days.",
          o: "BP 112/72 mmHg · HR 84 bpm · Temp 37.6°C · SpO₂ 99% · Throat: mild erythema",
          a: "Acute viral upper respiratory tract infection",
          p: "Panadol Extra 500mg TDS × 5 days. Loratadine 10mg OD × 5 days. Rest and hydration. Return if no improvement in 5 days.",
        },
      },
    ],
  },
];

/* ── Prescriptions (one per patient, consistent medicineIds) ─────────────── */

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    patientId: 1,
    doctorId: 2,
    createdAt: ts(3),
    diagnosis: "Hypertension follow-up",
    status: "active",
    items: [
      { medicineId: 6,  dose: "40mg",  frequency: "1-0-0", duration: 30, qty: 30 },
      { medicineId: 25, dose: "5mg",   frequency: "1-0-0", duration: 30, qty: 30 },
      { medicineId: 3,  dose: "500mg", frequency: "1-0-1", duration: 30, qty: 60 },
    ],
    total: 6 * 30 + 8 * 30 + 6 * 60,
  },
  {
    id: 2,
    patientId: 1,
    doctorId: 2,
    createdAt: ts(33),
    diagnosis: "Type 2 DM follow-up",
    status: "completed",
    items: [
      { medicineId: 3,  dose: "500mg", frequency: "1-0-1", duration: 30, qty: 60 },
      { medicineId: 4,  dose: "1g",    frequency: "0-0-1", duration: 30, qty: 30 },
    ],
    total: 6 * 60 + 15 * 30,
  },
  {
    id: 3,
    patientId: 2,
    doctorId: 2,
    createdAt: ts(7),
    diagnosis: "Asthma exacerbation",
    status: "active",
    items: [
      { medicineId: 9,  dose: "100mcg", frequency: "PRN",   duration: 30, qty: 1 },
      { medicineId: 10, dose: "10mg",   frequency: "0-0-1", duration: 30, qty: 30 },
    ],
    total: 360 * 1 + 22 * 30,
  },
  {
    id: 4,
    patientId: 3,
    doctorId: 2,
    createdAt: ts(12),
    diagnosis: "Cardiology follow-up",
    status: "active",
    items: [
      { medicineId: 5,  dose: "50mg", frequency: "1-0-0", duration: 30, qty: 30 },
      { medicineId: 7,  dose: "20mg", frequency: "0-0-1", duration: 30, qty: 30 },
      { medicineId: 21, dose: "75mg", frequency: "1-0-0", duration: 30, qty: 30 },
    ],
    total: 9 * 30 + 16 * 30 + 6 * 30,
  },
  {
    id: 5,
    patientId: 4,
    doctorId: 1,
    createdAt: ts(1),
    diagnosis: "Acute viral URI",
    status: "active",
    items: [
      { medicineId: 2,  dose: "500mg", frequency: "1-1-1", duration: 5, qty: 15 },
      { medicineId: 14, dose: "10mg",  frequency: "0-0-1", duration: 5, qty: 5  },
    ],
    total: 7 * 15 + 9 * 5,
  },
];

/* ── Analytics / chart data (kept from original, doesn't need state) ─────── */

export const monthlySeries = (() => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((m, i) => {
    const rev = 1_600_000 + i * 80_000 + Math.sin(i * 0.7) * 220_000;
    const cogs = rev * 0.43;
    const exp = 600_000;
    return {
      month: m,
      revenue: Math.round(rev),
      profit: Math.round(rev - cogs - exp),
      prescriptions: 380 + (i * 7 % 120) - 60,
      patients: 240 + (i * 11 % 90) - 45,
    };
  });
})();

export const last30Days = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: 50_000 + ((i * 7919) % 35_000) + (i > 22 ? 12_000 : 0),
    prescriptions: 14 + (i * 31 % 18),
    patients: 8 + (i * 17 % 14),
  };
});

export const peakHours = ["8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm"]
  .map((h, i) => ({ hour: h, visits: [3,8,18,22,14,7,9,16,21,17,12,8,4][i] }));

export const diseaseTrends = ["URI","HTN","T2DM","Gastritis","Asthma","Migraine","UTI"].map((d, i) => ({
  disease: d, count: 20 + (i * 31 % 120),
}));

export function fmtMoney(n: number) {
  if (n >= 1_000_000) return `₨ ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₨ ${(n / 1_000).toFixed(1)}K`;
  return `₨ ${n.toFixed(0)}`;
}

export function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export function dailyKPIs(patients: Patient[], medicines: Medicine[], prescriptions: Prescription[]) {
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const todayPrescriptions = prescriptions.filter(p => p.createdAt >= startOfDay.getTime()).length || 5;
  const monthRevenue = monthlySeries[monthlySeries.length - 1].revenue;
  const yearRevenue = monthlySeries.reduce((s, m) => s + m.revenue, 0);
  const monthProfit = monthlySeries[monthlySeries.length - 1].profit;
  const yearProfit = monthlySeries.reduce((s, m) => s + m.profit, 0);
  const inventoryValue = medicines.reduce((s, m) => s + m.stock * m.purchasePrice, 0);
  const todayRevenue = last30Days[last30Days.length - 1].revenue;
  const todayProfit = todayRevenue * 0.32;
  const lowStock = medicines.filter(m => m.stock <= m.lowStockAt).length;
  const expiringSoon = medicines.filter(m => m.expiry - Date.now() < 60 * 86_400_000).length;
  return {
    patientsTotal: patients.length,
    prescriptionsToday: todayPrescriptions,
    todayRevenue, monthRevenue, yearRevenue,
    todayProfit, monthProfit, yearProfit,
    inventoryValue, lowStock, expiringSoon,
    dues: 18_400,
    appointmentsToday: 12,
  };
}

/* ── Static data (unchanged throughout session) ──────────────────────────── */

export const CLINIC = { id: 1, name: "ClinicPulse Health", slug: "clinicpulse-health", plan: "Pro" };

export const BRANCHES = [
  { id: 1, name: "Gulberg Main", city: "Lahore", address: "MM Alam Rd, Block C", phone: "+92 42 35 778 110" },
];

export const USERS = [
  { id: 1, email: "admin@clinicpulse.app",   fullName: "Dr. Muhammad Usman",  role: "admin"        as const, branchId: 1, specialty: "Internal Medicine", initials: "MU", twoFactor: true,  active: true },
  { id: 2, email: "doctor@clinicpulse.app",  fullName: "Dr. Mahroona Laraib", role: "doctor"       as const, branchId: 1, specialty: "General Practice",  initials: "ML", twoFactor: true,  active: true },
  { id: 3, email: "front@clinicpulse.app",   fullName: "Maria Lopez",         role: "receptionist" as const, branchId: 1, specialty: null,                initials: "ML", twoFactor: false, active: true },
  { id: 4, email: "pharm@clinicpulse.app",   fullName: "Imran Yousaf",        role: "pharmacist"   as const, branchId: 1, specialty: null,                initials: "IY", twoFactor: false, active: true },
  { id: 5, email: "patient@clinicpulse.app", fullName: "Ali Hassan",          role: "patient"      as const, branchId: 1, specialty: null,                initials: "AH", twoFactor: false, active: true },
];

export type Role = "admin" | "doctor" | "receptionist" | "pharmacist" | "patient";

export const AUDIT_LOG = [
  { id: 1, user: "Dr. Muhammad Usman",  action: "Updated patient",      entity: "Patient CP-2001", at: Date.now() - 10 * 60 * 1000 },
  { id: 2, user: "Maria Lopez",          action: "Booked appointment",   entity: "Appt #4421",      at: Date.now() - 22 * 60 * 1000 },
  { id: 3, user: "Imran Yousaf",         action: "Stock adjustment",     entity: "Med #14",         at: Date.now() - 45 * 60 * 1000 },
  { id: 4, user: "Dr. Mahroona Laraib",  action: "Created prescription", entity: "Rx #4",           at: Date.now() - 60 * 60 * 1000 },
  { id: 5, user: "Dr. Muhammad Usman",   action: "Logged in",            entity: "Session",         at: Date.now() - 90 * 60 * 1000 },
  { id: 6, user: "Dr. Mahroona Laraib",  action: "Marked visit done",    entity: "Patient CP-2002", at: Date.now() - 110 * 60 * 1000 },
];

export const ACTIVE_SESSIONS = [
  { id: "s1", device: "MacBook Pro · Chrome 130", ip: "39.45.12.10",   location: "Lahore, PK",  lastActiveAt: Date.now() - 2 * 60 * 1000,        current: true  },
  { id: "s2", device: "iPhone 15 · Safari 17",    ip: "39.45.12.10",   location: "Lahore, PK",  lastActiveAt: Date.now() - 35 * 60 * 1000,       current: false },
  { id: "s3", device: "Windows · Edge 130",        ip: "182.180.4.21",  location: "Karachi, PK", lastActiveAt: Date.now() - 4 * 24 * 60 * 60 * 1000, current: false },
];

export const NOTIFICATIONS = [
  { id: 1, type: "low_stock",   title: "Low stock: Cefixime 400mg",     body: "Only 15 caps remaining at Gulberg Main.",    createdAt: Date.now() - 60 * 60 * 1000,    read: false },
  { id: 2, type: "expiry",      title: "Expiring soon: Augmentin 625mg",body: "Batch B2401 expires in 28 days.",            createdAt: Date.now() - 3 * 60 * 60 * 1000, read: false },
  { id: 3, type: "appointment", title: "12 appointments today",         body: "3 walk-ins pending check-in.",              createdAt: Date.now() - 5 * 60 * 60 * 1000, read: false },
  { id: 4, type: "new_patient", title: "New patient: Sara Ahmed",       body: "Registered by Maria Lopez (front desk).",   createdAt: Date.now() - 9 * 60 * 60 * 1000, read: true  },
];

export const RX_TEMPLATES = [
  { id: "tpl-htn", name: "Hypertension", diagnosis: "Essential Hypertension", items: [
    { medicine: "Telmisartan 40mg", dose: "40mg", frequency: "1-0-0", duration: 30 },
    { medicine: "Amlodipine 5mg",   dose: "5mg",  frequency: "1-0-0", duration: 30 },
  ]},
  { id: "tpl-dm", name: "Type 2 Diabetes", diagnosis: "T2DM follow-up", items: [
    { medicine: "Metformin 500mg",   dose: "500mg", frequency: "1-0-1", duration: 30 },
    { medicine: "Atorvastatin 20mg", dose: "20mg",  frequency: "0-0-1", duration: 30 },
  ]},
  { id: "tpl-asthma", name: "Asthma", diagnosis: "Mild persistent asthma", items: [
    { medicine: "Salbutamol Inhaler", dose: "100mcg", frequency: "PRN",   duration: 30 },
    { medicine: "Montelukast 10mg",   dose: "10mg",   frequency: "0-0-1", duration: 30 },
  ]},
  { id: "tpl-uri", name: "URI", diagnosis: "Acute viral URI", items: [
    { medicine: "Panadol Extra",    dose: "500mg", frequency: "1-1-1", duration: 5 },
    { medicine: "Loratadine 10mg",  dose: "10mg",  frequency: "0-0-1", duration: 5 },
  ]},
];

/* ── Additional static data for pages that read but don't mutate ──────────── */

export type Appointment = {
  id: number; patientId: number; doctorId: number; branchId: number;
  scheduledAt: number; status: "scheduled"|"checked_in"|"in_progress"|"done"|"cancelled";
  token: number; reason: string; channel: "online"|"walk_in"|"phone";
};

// Simple deterministic appointments for the 4 seed patients
const _today = new Date(); _today.setHours(10,0,0,0);
const _d = 24*60*60*1000;
export const APPOINTMENTS: Appointment[] = (() => {
  const statuses: Appointment["status"][] = ["done","in_progress","checked_in","scheduled","scheduled","scheduled","scheduled","scheduled","scheduled","scheduled","scheduled","scheduled"];
  const reasons = ["Consultation","Follow-up","Lab review","Vaccination","Procedure"];
  const channels: ("online"|"walk_in"|"phone")[] = ["online","walk_in","phone"];
  const patientIds = [1,2,3,4];
  const out: Appointment[] = [];
  let id = 1;
  for (let d = -14; d <= 14; d++) {
    const count = 4 + (Math.abs(d) % 3);
    for (let t = 0; t < count; t++) {
      const date = new Date(_today);
      date.setDate(date.getDate() + d);
      date.setHours(9 + Math.floor(t / 2), (t % 2) * 30, 0, 0);
      const pId = patientIds[t % patientIds.length];
      const status = d < 0 ? "done" : d === 0 ? statuses[t] || "scheduled" : "scheduled";
      out.push({
        id: id++, patientId: pId, doctorId: (pId % 2) + 1, branchId: 1,
        scheduledAt: date.getTime(), status,
        token: t + 1,
        reason: reasons[t % reasons.length],
        channel: channels[t % channels.length],
      });
    }
  }
  return out;
})();

export type Payment = {
  id: number; patientId: number; prescriptionId: number;
  amount: number; method: string; status: "paid"|"due";
  invoiceNo: string; createdAt: number;
};
export const PAYMENTS: Payment[] = SEED_PRESCRIPTIONS.map((p, i) => ({
  id: i + 1, patientId: p.patientId, prescriptionId: p.id,
  amount: Math.round(p.total * 100) / 100,
  method: ["Cash","Card","JazzCash","Easypaisa","Bank"][i % 5],
  status: i === 1 ? "due" : "paid",
  invoiceNo: `INV-${10001 + i}`,
  createdAt: p.createdAt,
}));

export const EXPENSES = (() => {
  const out: { id: number; category: string; amount: number; spentAt: number; note: string }[] = [];
  let id = 1;
  const cats: [string, number][] = [["Rent",420000],["Salary",180000],["Utilities",45000],["Supplies",18000],["Misc",6000]];
  for (let d = -90; d <= 0; d += 3) {
    const [cat, base] = cats[Math.abs(d) % cats.length];
    out.push({
      id: id++, category: cat,
      amount: Math.round(base * (0.8 + (id % 3) * 0.1)),
      spentAt: _today.getTime() + d * _d,
      note: cat === "Salary" ? "Monthly salary" : cat === "Rent" ? "Branch rent" : "—",
    });
  }
  return out;
})();

export const topMedicines = [...SEED_MEDICINES]
  .sort((a, b) => b.sold30d - a.sold30d)
  .slice(0, 7)
  .map(m => ({ name: m.name.split(" ")[0], sold: m.sold30d, revenue: m.sold30d * m.sellingPrice }));

export const doctorPerformance = SEED_DOCTORS.map((d, i) => ({
  doctor: d.fullName.replace("Dr. ", ""),
  patients: 60 + i * 40,
  prescriptions: 80 + i * 50,
  revenue: 420_000 + i * 300_000,
  rating: (4.4 + i * 0.1).toFixed(1),
}));
