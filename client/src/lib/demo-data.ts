/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Realistic in-memory demo data for ClinicPulse.
 * Deterministic via a seeded PRNG so charts and lists stay stable across renders.
 */

const seedrandom = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};
const rand = seedrandom(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a;

export const CLINIC = { id: 1, name: "ClinicPulse Health", slug: "clinicpulse-health", plan: "Pro" };

export const BRANCHES = [
  { id: 1, name: "Gulberg Main", city: "Lahore", address: "MM Alam Rd, Block C", phone: "+92 42 35 778 110" },
  { id: 2, name: "DHA Phase 5",  city: "Karachi", address: "Khayaban-e-Shahbaz", phone: "+92 21 35 880 220" },
  { id: 3, name: "F-7 Markaz",   city: "Islamabad", address: "Street 14, F-7", phone: "+92 51 26 990 330" },
];

export type Role = "admin" | "doctor" | "receptionist" | "pharmacist" | "patient";

export const USERS = [
  { id: 1, email: "admin@clinicpulse.app",   fullName: "Dr. Sara Khan",      role: "admin"        as Role, branchId: 1, specialty: "Internal Medicine", initials: "SK", twoFactor: true,  active: true },
  { id: 2, email: "doctor@clinicpulse.app",  fullName: "Dr. Adeel Rahman",   role: "doctor"       as Role, branchId: 1, specialty: "Cardiology",        initials: "AR", twoFactor: true,  active: true },
  { id: 3, email: "doctor2@clinicpulse.app", fullName: "Dr. Hina Saeed",     role: "doctor"       as Role, branchId: 2, specialty: "Pediatrics",        initials: "HS", twoFactor: false, active: true },
  { id: 4, email: "doctor3@clinicpulse.app", fullName: "Dr. Faisal Mahmood", role: "doctor"       as Role, branchId: 3, specialty: "Pulmonology",       initials: "FM", twoFactor: true,  active: true },
  { id: 5, email: "front@clinicpulse.app",   fullName: "Maria Lopez",        role: "receptionist" as Role, branchId: 1, specialty: null,                 initials: "ML", twoFactor: false, active: true },
  { id: 6, email: "pharm@clinicpulse.app",   fullName: "Imran Yousaf",       role: "pharmacist"   as Role, branchId: 1, specialty: null,                 initials: "IY", twoFactor: false, active: true },
  { id: 7, email: "patient@clinicpulse.app", fullName: "Ali Hassan",         role: "patient"      as Role, branchId: 1, specialty: null,                 initials: "AH", twoFactor: false, active: true },
];

export const DOCTORS = USERS.filter(u => u.role === "doctor" || u.role === "admin");

const FIRST = ["Ali","Hassan","Maryam","Zara","Ahmed","Bilal","Sara","Fatima","Hamza","Omar","Aisha","Usman","Iqra","Saad","Rida","Ayesha","Tariq","Nadia","Junaid","Mehreen","Adnan","Saba","Kamran","Lubna","Imran","Sadia","Junaid","Hira","Khalid","Sania"];
const LAST  = ["Khan","Ahmad","Malik","Sheikh","Iqbal","Raza","Akhtar","Aslam","Nasir","Farooq","Hussain","Siddiqui","Qureshi","Butt","Chaudhry","Baig","Memon","Awan","Tariq","Yousaf"];
const BLOOD = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const ALLERGIES_POOL = ["Penicillin","Sulfa","NSAIDs","Latex","Pollen","Peanuts","Shellfish","Aspirin"];
const CHRONIC_POOL = ["Hypertension","Type 2 Diabetes","Asthma","Hyperlipidemia","Hypothyroidism","CKD Stage 2","GERD"];
const DIAGNOSES = ["URI","Hypertension follow-up","Type 2 DM follow-up","Acute gastroenteritis","Migraine","Asthma exacerbation","UTI","Allergic rhinitis","Lower back pain","Anxiety disorder","Iron deficiency anemia","Bronchitis"];

const today = new Date(); today.setHours(10,0,0,0);
const day = 24*60*60*1000;

export type Patient = {
  id: number; mrn: string; fullName: string; age: number; gender: "M"|"F";
  phone: string; email: string; address: string; bloodGroup: string;
  allergies: string[]; chronic: string[]; vaccinations: string[];
  branchId: number; doctorId: number;
  diagnosis: string; lastVisitAt: number; createdAt: number;
  notes: string; family: { mother?: string; father?: string; siblings?: string };
  visits: { id: number; date: number; doctorId: number; diagnosis: string; soap: { s: string; o: string; a: string; p: string } }[];
};

const PATIENTS: Patient[] = Array.from({ length: 84 }).map((_, i) => {
  const id = i + 1;
  const gender: "M"|"F" = rand() > 0.5 ? "M" : "F";
  const fn = pick(FIRST); const ln = pick(LAST);
  const age = intBetween(2, 78);
  const branchId = pick(BRANCHES).id;
  const docPool = DOCTORS.filter(d => d.branchId === branchId);
  const doc = (docPool.length ? docPool : DOCTORS)[Math.floor(rand()*Math.max(1, docPool.length || DOCTORS.length))];
  const lastVisitAt = today.getTime() - intBetween(0, 60) * day;
  const visitCount = intBetween(1, 5);
  const visits = Array.from({ length: visitCount }).map((__, j) => {
    const dx = pick(DIAGNOSES);
    return {
      id: j + 1,
      date: lastVisitAt - j * intBetween(15, 90) * day,
      doctorId: doc.id,
      diagnosis: dx,
      soap: {
        s: `Patient reports ${pick(["fever","cough","fatigue","headache","abdominal pain","palpitations"])} for ${intBetween(1,7)} days.`,
        o: `BP ${100+intBetween(0,40)}/${60+intBetween(10,30)} mmHg • HR ${60+intBetween(0,40)} bpm • Temp ${(36.4 + rand()*1.6).toFixed(1)}°C • SpO₂ ${94+intBetween(0,5)}%`,
        a: dx,
        p: `Started ${pick(["Amoxicillin 500mg TDS","Metformin 500mg BID","Atenolol 50mg OD","Salbutamol PRN","Pantoprazole 40mg OD"])}, follow-up in ${intBetween(7,21)} days.`,
      },
    };
  });
  return {
    id, mrn: `CP-${String(2000 + id)}`, fullName: `${fn} ${ln}`, age, gender,
    phone: `+92 3${intBetween(0,4)}${intBetween(0,9)} ${intBetween(1000000, 9999999)}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@mail.com`,
    address: `${intBetween(1,200)}-${pick(["A","B","C","D","E"])}, ${pick(["Gulberg","DHA","Bahria","Clifton","Johar Town","F-10","G-9"])}, ${pick(BRANCHES).city}`,
    bloodGroup: pick(BLOOD),
    allergies: rand() > 0.6 ? [pick(ALLERGIES_POOL)] : [],
    chronic: rand() > 0.5 ? (rand() > 0.5 ? [pick(CHRONIC_POOL)] : [pick(CHRONIC_POOL), pick(CHRONIC_POOL)]) : [],
    vaccinations: ["Hep B", "Tdap", "Influenza ‘24", "COVID-19 booster"].filter(() => rand() > 0.4),
    branchId, doctorId: doc.id,
    diagnosis: visits[0].diagnosis,
    lastVisitAt, createdAt: lastVisitAt - intBetween(60, 700) * day,
    notes: rand() > 0.6 ? "Patient prefers morning appointments. Punctual and compliant with therapy." : "",
    family: { mother: rand() > 0.5 ? "Hypertension" : undefined, father: rand() > 0.5 ? "Type 2 Diabetes" : undefined },
    visits,
  };
});
export { PATIENTS };

/* Medicines */
const MED_NAMES = [
  ["Augmentin 625mg","Amoxicillin/Clavulanate","GSK","tab",18,28,32],
  ["Panadol Extra","Paracetamol/Caffeine","GSK","tab",4,7,180],
  ["Metformin 500mg","Metformin","Searle","tab",3,6,240],
  ["Glucophage XR 1g","Metformin XR","Merck","tab",9,15,140],
  ["Atenolol 50mg","Atenolol","ICI","tab",5,9,220],
  ["Telmisartan 40mg","Telmisartan","Hilton","tab",12,20,160],
  ["Atorvastatin 20mg","Atorvastatin","Getz","tab",10,16,200],
  ["Pantoprazole 40mg","Pantoprazole","Searle","tab",6,11,260],
  ["Salbutamol Inhaler","Salbutamol","GSK","unit",240,360,42],
  ["Montelukast 10mg","Montelukast","Hilton","tab",14,22,90],
  ["Cefixime 400mg","Cefixime","Sami","cap",60,95,15],
  ["Azithromycin 500mg","Azithromycin","Pfizer","tab",55,85,12],
  ["Ciprofloxacin 500mg","Ciprofloxacin","Bayer","tab",18,30,80],
  ["Loratadine 10mg","Loratadine","Highnoon","tab",5,9,300],
  ["Ibuprofen 400mg","Ibuprofen","Abbott","tab",4,8,180],
  ["ORS Sachet","Oral Rehydration Salts","Searle","sachet",18,30,120],
  ["Insulin Mixtard 30","Insulin Human","Novo Nordisk","unit",520,720,18],
  ["Levothyroxine 50mcg","Levothyroxine","Searle","tab",5,9,140],
  ["Vitamin D3 5000IU","Cholecalciferol","Pharmevo","cap",10,18,220],
  ["Folic Acid 5mg","Folic Acid","Hilton","tab",2,4,400],
  ["Aspirin 75mg","Aspirin","Bayer","tab",3,6,500],
  ["Omeprazole 40mg","Omeprazole","Highnoon","cap",8,14,160],
  ["Diclofenac 50mg","Diclofenac","Novartis","tab",5,9,90],
  ["Cetirizine 10mg","Cetirizine","Sanofi","tab",3,6,260],
  ["Amlodipine 5mg","Amlodipine","Pfizer","tab",4,8,300],
];

export type Medicine = {
  id: number; name: string; generic: string; company: string; unit: string;
  purchasePrice: number; sellingPrice: number; stock: number; lowStockAt: number;
  batchNo: string; expiry: number; barcode: string; sold30d: number;
};

export const MEDICINES: Medicine[] = MED_NAMES.map(([name,generic,company,unit,pp,sp,stock], i) => {
  const expiryMonths = intBetween(1, 24);
  return {
    id: i + 1,
    name: name as string, generic: generic as string, company: company as string, unit: unit as string,
    purchasePrice: pp as number, sellingPrice: sp as number,
    stock: stock as number, lowStockAt: 25,
    batchNo: `B${2400 + i}`,
    expiry: today.getTime() + expiryMonths * 30 * day,
    barcode: `${849000000000 + i}`,
    sold30d: intBetween(20, 320),
  };
});

/* Appointments — for next 14 days + last 14 */
export type Appointment = {
  id: number; patientId: number; doctorId: number; branchId: number;
  scheduledAt: number; status: "scheduled"|"checked_in"|"in_progress"|"done"|"cancelled";
  token: number; reason: string; channel: "online"|"walk_in"|"phone";
};
export const APPOINTMENTS: Appointment[] = (() => {
  const out: Appointment[] = [];
  let id = 1;
  for (let d = -14; d <= 14; d++) {
    const tokensPerDay = intBetween(8, 20);
    for (let t = 1; t <= tokensPerDay; t++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      date.setHours(9 + Math.floor((t-1)/3), ((t-1) % 3) * 20, 0, 0);
      const p = PATIENTS[intBetween(0, PATIENTS.length - 1)];
      const doc = DOCTORS[intBetween(0, DOCTORS.length - 1)];
      const status: Appointment["status"] =
        d < 0 ? (rand() > 0.1 ? "done" : "cancelled") :
        d === 0 ? (t < 4 ? "done" : t < 6 ? "in_progress" : t < 8 ? "checked_in" : "scheduled") :
        "scheduled";
      out.push({
        id: id++, patientId: p.id, doctorId: doc.id, branchId: p.branchId,
        scheduledAt: date.getTime(), status, token: t,
        reason: pick(["Consultation","Follow-up","Lab review","Vaccination","Procedure"]),
        channel: pick(["online","walk_in","phone"]),
      });
    }
  }
  return out;
})();

/* Prescriptions */
export type Prescription = {
  id: number; patientId: number; doctorId: number; createdAt: number;
  diagnosis: string; status: "active"|"completed"|"cancelled";
  items: { medicineId: number; dose: string; frequency: string; duration: number; qty: number }[];
  total: number;
};
export const PRESCRIPTIONS: Prescription[] = Array.from({ length: 220 }).map((_, i) => {
  const p = PATIENTS[intBetween(0, PATIENTS.length - 1)];
  const doc = DOCTORS[intBetween(0, DOCTORS.length - 1)];
  const itemCount = intBetween(2, 5);
  const items = Array.from({ length: itemCount }).map(() => {
    const m = MEDICINES[intBetween(0, MEDICINES.length - 1)];
    const dur = intBetween(3, 14);
    const freqOpts = ["1-0-1","1-0-0","0-0-1","1-1-1","1-0-1 PRN"];
    const freq = pick(freqOpts);
    const tabsPerDay = freq.split("-").reduce((a,b)=>a+(parseInt(b)||0),0);
    const qty = Math.max(1, dur * tabsPerDay);
    return { medicineId: m.id, dose: pick(["500mg","250mg","40mg","10mg","20mg","100mg","5mg","75mg"]), frequency: freq, duration: dur, qty };
  });
  const total = items.reduce((s, it) => {
    const m = MEDICINES.find(x => x.id === it.medicineId)!;
    return s + m.sellingPrice * it.qty;
  }, 0);
  return {
    id: i + 1, patientId: p.id, doctorId: doc.id,
    createdAt: today.getTime() - intBetween(0, 60) * day,
    diagnosis: pick(DIAGNOSES),
    status: rand() > 0.05 ? "active" : "completed",
    items, total,
  };
});

/* Payments */
export const PAYMENTS = PRESCRIPTIONS.map((p, i) => {
  const method = pick(["Cash","Card","JazzCash","Easypaisa","Bank"]);
  const due = rand() > 0.86;
  return {
    id: i + 1, patientId: p.patientId, prescriptionId: p.id,
    amount: Math.round(p.total * 100) / 100,
    method, status: due ? "due" : "paid",
    invoiceNo: `INV-${10000 + i}`,
    createdAt: p.createdAt,
  };
});

/* Expenses */
export const EXPENSES = (() => {
  const out: any[] = [];
  let id = 1;
  for (let d = -90; d <= 0; d += 1) {
    if (rand() > 0.55) {
      const cats = [["Rent",420000],["Salary",180000],["Utilities",45000],["Supplies",18000],["Misc",6000]];
      const [cat, base] = pick(cats);
      out.push({
        id: id++, category: cat,
        amount: (base as number) * (0.7 + rand() * 0.6),
        spentAt: today.getTime() + d * day,
        note: cat === "Salary" ? "Monthly salary" : cat === "Rent" ? "Branch rent" : "—",
      });
    }
  }
  return out;
})();

/* Notifications */
export const NOTIFICATIONS = [
  { id: 1, type: "low_stock",   title: "Low stock: Cefixime 400mg",     body: "Only 15 caps remaining at Gulberg Main.",    createdAt: today.getTime() - 60*60*1000,    read: false },
  { id: 2, type: "expiry",      title: "Expiring soon: Augmentin 625mg",body: "Batch B2403 expires in 28 days.",            createdAt: today.getTime() - 3*60*60*1000, read: false },
  { id: 3, type: "appointment", title: "12 appointments today",         body: "3 walk-ins pending check-in.",                createdAt: today.getTime() - 5*60*60*1000, read: false },
  { id: 4, type: "due",         title: "Pending payment: ₨ 18,400",     body: "INV-10092 — Hassan Khan, due 3 days.",       createdAt: today.getTime() - 8*60*60*1000, read: true  },
  { id: 5, type: "new_patient", title: "New patient: Maryam Iqbal",     body: "Registered by Maria Lopez (front desk).",    createdAt: today.getTime() - 9*60*60*1000, read: true  },
  { id: 6, type: "summary",     title: "Daily summary ready",           body: "₨ 412,800 revenue • 67 prescriptions.",      createdAt: today.getTime() - 12*60*60*1000,read: true  },
];

/* Audit log */
export const AUDIT_LOG = [
  { id: 1, user: "Dr. Sara Khan",      action: "Updated patient",      entity: "Patient #CP-2014", at: today.getTime() - 10*60*1000 },
  { id: 2, user: "Maria Lopez",        action: "Booked appointment",   entity: "Appt #4421",       at: today.getTime() - 22*60*1000 },
  { id: 3, user: "Imran Yousaf",       action: "Stock adjustment",     entity: "Med #14",          at: today.getTime() - 45*60*1000 },
  { id: 4, user: "Dr. Adeel Rahman",   action: "Created prescription", entity: "Rx #220",          at: today.getTime() - 60*60*1000 },
  { id: 5, user: "Dr. Sara Khan",      action: "Logged in",            entity: "Session",          at: today.getTime() - 90*60*1000 },
  { id: 6, user: "Dr. Hina Saeed",     action: "Marked visit done",    entity: "Visit #318",       at: today.getTime() - 110*60*1000 },
];

/* Sessions */
export const ACTIVE_SESSIONS = [
  { id: "s1", device: "MacBook Pro · Chrome 130", ip: "39.45.12.10", location: "Lahore, PK", lastActiveAt: today.getTime() - 2*60*1000,  current: true  },
  { id: "s2", device: "iPhone 15 · Safari 17",    ip: "39.45.12.10", location: "Lahore, PK", lastActiveAt: today.getTime() - 35*60*1000, current: false },
  { id: "s3", device: "Windows · Edge 130",       ip: "182.180.4.21", location: "Karachi, PK", lastActiveAt: today.getTime() - 4*24*60*60*1000, current: false },
];

/* Templates */
export const RX_TEMPLATES = [
  { id: "tpl-htn", name: "Hypertension", diagnosis: "Essential Hypertension", items: [
    { medicine: "Telmisartan 40mg", dose: "40mg", frequency: "1-0-0", duration: 30 },
    { medicine: "Amlodipine 5mg",   dose: "5mg",  frequency: "1-0-0", duration: 30 },
  ]},
  { id: "tpl-dm", name: "Type 2 Diabetes", diagnosis: "T2DM follow-up", items: [
    { medicine: "Metformin 500mg",  dose: "500mg", frequency: "1-0-1", duration: 30 },
    { medicine: "Atorvastatin 20mg",dose: "20mg",  frequency: "0-0-1", duration: 30 },
  ]},
  { id: "tpl-asthma", name: "Asthma", diagnosis: "Mild persistent asthma", items: [
    { medicine: "Salbutamol Inhaler", dose: "100mcg", frequency: "PRN",   duration: 30 },
    { medicine: "Montelukast 10mg",   dose: "10mg",   frequency: "0-0-1", duration: 30 },
  ]},
  { id: "tpl-uri", name: "URI", diagnosis: "Acute viral URI", items: [
    { medicine: "Panadol Extra",  dose: "500mg", frequency: "1-1-1", duration: 5 },
    { medicine: "Loratadine 10mg",dose: "10mg",  frequency: "0-0-1", duration: 5 },
  ]},
  { id: "tpl-gastro", name: "Gastroenteritis", diagnosis: "Acute gastroenteritis", items: [
    { medicine: "ORS Sachet",         dose: "1 sachet/L", frequency: "PRN",   duration: 3 },
    { medicine: "Pantoprazole 40mg",  dose: "40mg",       frequency: "1-0-0", duration: 5 },
  ]},
  { id: "tpl-fever", name: "Fever (OPD)", diagnosis: "Pyrexia of unknown origin", items: [
    { medicine: "Panadol Extra", dose: "500mg", frequency: "1-1-1", duration: 3 },
  ]},
];

/* Charts: 12 months revenue/profit + last 30 days */
export const monthlySeries = (() => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((m, i) => {
    const rev = 1.6e6 + i * 80_000 + (Math.sin(i * 0.7) * 220_000) + intBetween(-80_000, 80_000);
    const cogs = rev * (0.42 + (Math.sin(i) * 0.04));
    const exp  = 600_000 + intBetween(-50_000, 50_000);
    return { month: m, revenue: Math.round(rev), profit: Math.round(rev - cogs - exp), prescriptions: 380 + intBetween(-60, 80), patients: 240 + intBetween(-40, 70) };
  });
})();

export const last30Days = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(today); d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: 50_000 + intBetween(0, 35_000) + (i > 22 ? 12_000 : 0),
    prescriptions: 14 + intBetween(0, 18),
    patients: 8 + intBetween(0, 14),
  };
});

export const peakHours = ["8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm"]
  .map((h, i) => ({ hour: h, visits: [3,8,18,22,14,7,9,16,21,17,12,8,4][i] }));

export const diseaseTrends = ["URI","HTN","T2DM","Gastritis","Asthma","Migraine","UTI"].map(d => ({
  disease: d, count: intBetween(20, 140),
}));

export const topMedicines = [...MEDICINES]
  .sort((a, b) => b.sold30d - a.sold30d)
  .slice(0, 7)
  .map(m => ({ name: m.name.split(" ")[0], sold: m.sold30d, revenue: m.sold30d * m.sellingPrice }));

export const doctorPerformance = DOCTORS.map(d => ({
  doctor: d.fullName.replace("Dr. ", ""),
  patients: intBetween(60, 220),
  prescriptions: intBetween(80, 260),
  revenue: intBetween(420_000, 1_400_000),
  rating: (4.4 + rand() * 0.5).toFixed(1),
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

export function dailyKPIs() {
  const now = today.getTime();
  const todayMs = now;
  const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
  const todayPrescriptions = PRESCRIPTIONS.filter(p => p.createdAt >= startOfDay.getTime()).length || 14;
  const monthRevenue = monthlySeries[monthlySeries.length - 1].revenue;
  const yearRevenue = monthlySeries.reduce((s, m) => s + m.revenue, 0);
  const monthProfit = monthlySeries[monthlySeries.length - 1].profit;
  const yearProfit = monthlySeries.reduce((s, m) => s + m.profit, 0);
  const inventoryValue = MEDICINES.reduce((s, m) => s + m.stock * m.purchasePrice, 0);
  const todayRevenue = last30Days[last30Days.length - 1].revenue * 1.0;
  const todayProfit = todayRevenue * 0.32;
  const lowStock = MEDICINES.filter(m => m.stock <= m.lowStockAt).length;
  const expiringSoon = MEDICINES.filter(m => m.expiry - todayMs < 60 * day).length;
  const dues = PAYMENTS.filter(p => p.status === "due").reduce((s, p) => s + p.amount, 0);
  return {
    patientsTotal: PATIENTS.length,
    prescriptionsToday: todayPrescriptions,
    todayRevenue, monthRevenue, yearRevenue,
    todayProfit, monthProfit, yearProfit,
    inventoryValue, lowStock, expiringSoon, dues,
    appointmentsToday: APPOINTMENTS.filter(a => {
      const d = new Date(a.scheduledAt); const t = new Date(today);
      return d.toDateString() === t.toDateString();
    }).length,
  };
}
