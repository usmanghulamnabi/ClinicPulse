/**
 * ClinicPulse — Vercel Serverless API Handler (Postgres-backed)
 *
 * Persistence model:
 *   - All CRUD data (patients, prescriptions, medicines, doctors) stored in Postgres.
 *   - On first request (cold start), initDb() runs CREATE TABLE IF NOT EXISTS
 *     and seeds defaults if tables are empty.
 *   - Auth accounts remain in-memory (DEMO_ACCOUNTS) — no DB required for auth.
 *   - Env var: POSTGRES_URL — set in Vercel project dashboard.
 *
 * Routes:
 *   POST /api/auth/login
 *   POST /api/auth/signup
 *   POST /api/auth/password/request
 *   POST /api/auth/password/reset
 *   GET  /api/auth/me
 *   GET  /api/health
 *
 *   GET    /api/patients
 *   POST   /api/patients
 *   GET    /api/patients/:id
 *   PATCH  /api/patients/:id
 *   DELETE /api/patients/:id
 *   DELETE /api/patients  (bulk, body: { ids: number[] })
 *
 *   GET    /api/prescriptions
 *   POST   /api/prescriptions
 *   PATCH  /api/prescriptions/:id
 *
 *   GET    /api/medicines
 *   POST   /api/medicines
 *   DELETE /api/medicines/:id
 *
 *   GET    /api/doctors
 *   POST   /api/doctors
 *   PATCH  /api/doctors/:id
 */

import postgres from "postgres";

/* ── Postgres connection ──────────────────────────────────────────────────── */

let sql;
function getDb() {
  if (!sql) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set. Please configure it in your Vercel project settings.");
    }
    sql = postgres(process.env.POSTGRES_URL, {
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 30,
    });
  }
  return sql;
}

/* ── DB init flag ─────────────────────────────────────────────────────────── */

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;
  const db = getDb();

  // Create tables
  await db`
    CREATE TABLE IF NOT EXISTS doctors (
      id           SERIAL PRIMARY KEY,
      email        TEXT NOT NULL DEFAULT '',
      full_name    TEXT NOT NULL,
      specialty    TEXT NOT NULL DEFAULT 'General Practice',
      branch_id    INTEGER NOT NULL DEFAULT 1,
      initials     TEXT NOT NULL DEFAULT '',
      active       BOOLEAN NOT NULL DEFAULT true,
      phone        TEXT NOT NULL DEFAULT '',
      created_at   BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS medicines (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL,
      generic        TEXT NOT NULL DEFAULT '',
      company        TEXT NOT NULL DEFAULT '',
      unit           TEXT NOT NULL DEFAULT 'tab',
      purchase_price NUMERIC NOT NULL DEFAULT 0,
      selling_price  NUMERIC NOT NULL DEFAULT 0,
      stock          INTEGER NOT NULL DEFAULT 0,
      low_stock_at   INTEGER NOT NULL DEFAULT 25,
      batch_no       TEXT NOT NULL DEFAULT '',
      expiry         BIGINT NOT NULL DEFAULT 0,
      barcode        TEXT NOT NULL DEFAULT '',
      sold_30d       INTEGER NOT NULL DEFAULT 0,
      created_at     BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS patients (
      id            SERIAL PRIMARY KEY,
      mrn           TEXT NOT NULL DEFAULT '',
      full_name     TEXT NOT NULL,
      age           INTEGER NOT NULL DEFAULT 30,
      gender        TEXT NOT NULL DEFAULT 'M',
      phone         TEXT NOT NULL DEFAULT '',
      email         TEXT NOT NULL DEFAULT '',
      address       TEXT NOT NULL DEFAULT '',
      blood_group   TEXT NOT NULL DEFAULT 'O+',
      allergies     JSONB NOT NULL DEFAULT '[]',
      chronic       JSONB NOT NULL DEFAULT '[]',
      vaccinations  JSONB NOT NULL DEFAULT '[]',
      branch_id     INTEGER NOT NULL DEFAULT 1,
      doctor_id     INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      diagnosis     TEXT NOT NULL DEFAULT '',
      last_visit_at BIGINT NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL DEFAULT 0,
      notes         TEXT NOT NULL DEFAULT '',
      family        JSONB NOT NULL DEFAULT '{}',
      visits        JSONB NOT NULL DEFAULT '[]'
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id          SERIAL PRIMARY KEY,
      patient_id  INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id   INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      created_at  BIGINT NOT NULL DEFAULT 0,
      diagnosis   TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'active',
      items       JSONB NOT NULL DEFAULT '[]',
      total       NUMERIC NOT NULL DEFAULT 0
    )
  `;

  // Seed if empty
  const [{ count: doctorCount }] = await db`SELECT COUNT(*)::int AS count FROM doctors`;
  if (doctorCount === 0) {
    await seedDefaults(db);
  }

  dbInitialized = true;
}

/* ── Seed data ────────────────────────────────────────────────────────────── */

async function seedDefaults(db) {
  const now = Date.now();
  const day = 86_400_000;

  // Doctors
  await db`
    INSERT INTO doctors (id, email, full_name, specialty, branch_id, initials, active, phone) VALUES
      (1, 'admin@clinicpulse.app',   'Dr. Sara Khan',      'Internal Medicine', 1, 'SK', true, '+92 300 1234501'),
      (2, 'doctor@clinicpulse.app',  'Dr. Adeel Rahman',   'Cardiology',        1, 'AR', true, '+92 300 1234502'),
      (3, 'doctor2@clinicpulse.app', 'Dr. Hina Saeed',     'Pediatrics',        1, 'HS', true, '+92 300 1234503'),
      (4, 'doctor3@clinicpulse.app', 'Dr. Faisal Mahmood', 'Pulmonology',       1, 'FM', true, '+92 300 1234504')
    ON CONFLICT (id) DO NOTHING
  `;

  // Reset doctor sequence
  await db`SELECT setval('doctors_id_seq', 4, true)`;

  // Medicines (25 records)
  await db`
    INSERT INTO medicines (id, name, generic, company, unit, purchase_price, selling_price, stock, low_stock_at, batch_no, expiry, barcode, sold_30d) VALUES
      (1,  'Augmentin 625mg',    'Amoxicillin/Clavulanate', 'GSK',         'tab',    18,  28,  32,  25, 'B2401', ${now + 185*day}, '849000000001', 140),
      (2,  'Panadol Extra',      'Paracetamol/Caffeine',    'GSK',         'tab',    4,   7,   180, 25, 'B2402', ${now + 368*day}, '849000000002', 280),
      (3,  'Metformin 500mg',    'Metformin',               'Searle',      'tab',    3,   6,   240, 25, 'B2403', ${now + 300*day}, '849000000003', 220),
      (4,  'Glucophage XR 1g',  'Metformin XR',            'Merck',       'tab',    9,   15,  140, 25, 'B2404', ${now + 220*day}, '849000000004', 160),
      (5,  'Atenolol 50mg',     'Atenolol',                'ICI',         'tab',    5,   9,   220, 25, 'B2405', ${now + 185*day}, '849000000005', 180),
      (6,  'Telmisartan 40mg',  'Telmisartan',             'Hilton',      'tab',    12,  20,  160, 25, 'B2406', ${now + 270*day}, '849000000006', 130),
      (7,  'Atorvastatin 20mg', 'Atorvastatin',            'Getz',        'tab',    10,  16,  200, 25, 'B2407', ${now + 320*day}, '849000000007', 190),
      (8,  'Pantoprazole 40mg', 'Pantoprazole',            'Searle',      'tab',    6,   11,  260, 25, 'B2408', ${now + 180*day}, '849000000008', 210),
      (9,  'Salbutamol Inhaler','Salbutamol',              'GSK',         'unit',   240, 360, 42,  15, 'B2409', ${now + 185*day}, '849000000009', 60),
      (10, 'Montelukast 10mg',  'Montelukast',             'Hilton',      'tab',    14,  22,  90,  25, 'B2410', ${now + 240*day}, '849000000010', 80),
      (11, 'Cefixime 400mg',    'Cefixime',                'Sami',        'cap',    60,  95,  15,  25, 'B2411', ${now + 100*day}, '849000000011', 45),
      (12, 'Azithromycin 500mg','Azithromycin',            'Pfizer',      'tab',    55,  85,  12,  20, 'B2412', ${now + 120*day}, '849000000012', 50),
      (13, 'Ciprofloxacin 500mg','Ciprofloxacin',          'Bayer',       'tab',    18,  30,  80,  25, 'B2413', ${now + 210*day}, '849000000013', 95),
      (14, 'Loratadine 10mg',   'Loratadine',              'Highnoon',    'tab',    5,   9,   300, 25, 'B2414', ${now + 420*day}, '849000000014', 240),
      (15, 'Ibuprofen 400mg',   'Ibuprofen',               'Abbott',      'tab',    4,   8,   180, 25, 'B2415', ${now + 340*day}, '849000000015', 200),
      (16, 'ORS Sachet',        'Oral Rehydration Salts',  'Searle',      'sachet', 18,  30,  120, 25, 'B2416', ${now + 550*day}, '849000000016', 110),
      (17, 'Insulin Mixtard 30','Insulin Human',           'Novo Nordisk','unit',   520, 720, 18,  10, 'B2417', ${now + 180*day}, '849000000017', 30),
      (18, 'Levothyroxine 50mcg','Levothyroxine',          'Searle',      'tab',    5,   9,   140, 25, 'B2418', ${now + 185*day}, '849000000018', 120),
      (19, 'Vitamin D3 5000IU', 'Cholecalciferol',         'Pharmevo',    'cap',    10,  18,  220, 25, 'B2419', ${now + 550*day}, '849000000019', 170),
      (20, 'Folic Acid 5mg',    'Folic Acid',              'Hilton',      'tab',    2,   4,   400, 30, 'B2420', ${now + 550*day}, '849000000020', 190),
      (21, 'Aspirin 75mg',      'Aspirin',                 'Bayer',       'tab',    3,   6,   500, 30, 'B2421', ${now + 540*day}, '849000000021', 320),
      (22, 'Omeprazole 40mg',   'Omeprazole',              'Highnoon',    'cap',    8,   14,  160, 25, 'B2422', ${now + 220*day}, '849000000022', 150),
      (23, 'Diclofenac 50mg',   'Diclofenac',              'Novartis',    'tab',    5,   9,   90,  25, 'B2423', ${now + 185*day}, '849000000023', 100),
      (24, 'Cetirizine 10mg',   'Cetirizine',              'Sanofi',      'tab',    3,   6,   260, 25, 'B2424', ${now + 420*day}, '849000000024', 220),
      (25, 'Amlodipine 5mg',    'Amlodipine',              'Pfizer',      'tab',    4,   8,   300, 25, 'B2425', ${now + 320*day}, '849000000025', 260)
    ON CONFLICT (id) DO NOTHING
  `;

  await db`SELECT setval('medicines_id_seq', 25, true)`;

  // Patients
  const p1visits = JSON.stringify([
    { id: 1, date: now - 3*day, doctorId: 2, diagnosis: "Hypertension follow-up", soap: { s: "Patient reports occasional headache and fatigue for 4 days.", o: "BP 148/92 mmHg · HR 78 bpm · Temp 36.8°C · SpO₂ 98%", a: "Essential Hypertension — partially controlled", p: "Continued Telmisartan 40mg OD, Amlodipine 5mg OD. Follow-up in 14 days." } },
    { id: 2, date: now - 33*day, doctorId: 2, diagnosis: "Type 2 DM follow-up", soap: { s: "Patient reports polyuria and increased thirst for 1 week.", o: "BP 142/88 mmHg · HR 76 bpm · FBS 178 mg/dL · HbA1c 7.2%", a: "Type 2 Diabetes — suboptimal control", p: "Increased Metformin 500mg to BID. Glucophage XR 1g OD added. Diet counselling given." } },
  ]);
  const p2visits = JSON.stringify([
    { id: 1, date: now - 7*day, doctorId: 3, diagnosis: "Asthma exacerbation", soap: { s: "Patient reports wheezing and shortness of breath for 2 days, worse at night.", o: "BP 118/76 mmHg · HR 92 bpm · SpO₂ 94% · Peak flow 68% predicted", a: "Mild persistent asthma — acute exacerbation", p: "Salbutamol inhaler PRN. Montelukast 10mg OD added. Prednisolone 5-day course. Follow-up in 10 days." } },
  ]);
  const p3visits = JSON.stringify([
    { id: 1, date: now - 12*day, doctorId: 2, diagnosis: "Cardiology follow-up", soap: { s: "Patient reports mild chest tightness on exertion and dyspnoea on climbing stairs.", o: "BP 152/96 mmHg · HR 68 bpm · SpO₂ 97% · ECG: sinus rhythm", a: "Hypertension with hyperlipidemia — requires optimisation", p: "Atenolol 50mg OD continued. Atorvastatin 20mg added. Aspirin 75mg OD. Repeat lipid profile in 6 weeks." } },
    { id: 2, date: now - 60*day, doctorId: 2, diagnosis: "Hypertension follow-up", soap: { s: "BP running high at home per patient log.", o: "BP 160/100 mmHg · HR 72 bpm", a: "Uncontrolled hypertension", p: "Amlodipine 5mg added. Lifestyle modifications advised." } },
  ]);
  const p4visits = JSON.stringify([
    { id: 1, date: now - 1*day, doctorId: 1, diagnosis: "Acute viral URI", soap: { s: "Patient reports sore throat, runny nose, and mild fever for 3 days.", o: "BP 112/72 mmHg · HR 84 bpm · Temp 37.6°C · SpO₂ 99% · Throat: mild erythema", a: "Acute viral upper respiratory tract infection", p: "Panadol Extra 500mg TDS × 5 days. Loratadine 10mg OD × 5 days. Rest and hydration. Return if no improvement in 5 days." } },
  ]);

  await db`
    INSERT INTO patients (id, mrn, full_name, age, gender, phone, email, address, blood_group, allergies, chronic, vaccinations, branch_id, doctor_id, diagnosis, last_visit_at, created_at, notes, family, visits) VALUES
      (1, 'CP-2001', 'Ali Hassan',   45, 'M', '+92 300 1234567', 'ali.hassan@mail.com',   '14-B, Gulberg III, Lahore',    'O+',  ${JSON.stringify(["Penicillin"])},   ${JSON.stringify(["Hypertension","Type 2 Diabetes"])}, ${JSON.stringify(["Hep B","Influenza '24","COVID-19 booster"])}, 1, 2, 'Hypertension follow-up', ${now - 3*day},   ${now - 420*day}, 'Patient prefers morning appointments. Compliant with therapy.', ${JSON.stringify({mother:"Hypertension",father:"Type 2 Diabetes"})}, ${p1visits}),
      (2, 'CP-2002', 'Maryam Iqbal', 32, 'F', '+92 321 9876543', 'maryam.iqbal@mail.com', '7-C, DHA Phase 4, Karachi',    'A+',  ${JSON.stringify([])},               ${JSON.stringify(["Asthma"])},                         ${JSON.stringify(["Hep B","Tdap","COVID-19 booster"])},          1, 3, 'Asthma exacerbation',    ${now - 7*day},   ${now - 200*day}, '', ${JSON.stringify({mother:"Asthma"})}, ${p2visits}),
      (3, 'CP-2003', 'Hamza Khan',   58, 'M', '+92 333 5556677', 'hamza.khan@mail.com',   '22-A, F-7 Markaz, Islamabad',  'B+',  ${JSON.stringify(["NSAIDs"])},        ${JSON.stringify(["Hypertension","Hyperlipidemia"])},   ${JSON.stringify(["Hep B","Influenza '24"])},                    1, 2, 'Cardiology follow-up',   ${now - 12*day},  ${now - 600*day}, 'Patient is a retired civil servant. Good compliance.', ${JSON.stringify({father:"Hypertension",mother:"Hyperlipidemia"})}, ${p3visits}),
      (4, 'CP-2004', 'Sara Ahmed',   27, 'F', '+92 312 3334455', 'sara.ahmed@mail.com',   '5-D, Bahria Town, Rawalpindi', 'AB-', ${JSON.stringify(["Sulfa"])},         ${JSON.stringify([])},                                 ${JSON.stringify(["Hep B","Tdap","COVID-19 booster","Influenza '24"])}, 1, 1, 'Acute viral URI',     ${now - 1*day},   ${now - 30*day},  '', ${JSON.stringify({})}, ${p4visits})
    ON CONFLICT (id) DO NOTHING
  `;

  await db`SELECT setval('patients_id_seq', 4, true)`;

  // Prescriptions
  const rx1items = JSON.stringify([{ medicineId: 6, dose: "40mg", frequency: "1-0-0", duration: 30, qty: 30 }, { medicineId: 25, dose: "5mg", frequency: "1-0-0", duration: 30, qty: 30 }, { medicineId: 3, dose: "500mg", frequency: "1-0-1", duration: 30, qty: 60 }]);
  const rx2items = JSON.stringify([{ medicineId: 3, dose: "500mg", frequency: "1-0-1", duration: 30, qty: 60 }, { medicineId: 4, dose: "1g", frequency: "0-0-1", duration: 30, qty: 30 }]);
  const rx3items = JSON.stringify([{ medicineId: 9, dose: "100mcg", frequency: "PRN", duration: 30, qty: 1 }, { medicineId: 10, dose: "10mg", frequency: "0-0-1", duration: 30, qty: 30 }]);
  const rx4items = JSON.stringify([{ medicineId: 5, dose: "50mg", frequency: "1-0-0", duration: 30, qty: 30 }, { medicineId: 7, dose: "20mg", frequency: "0-0-1", duration: 30, qty: 30 }, { medicineId: 21, dose: "75mg", frequency: "1-0-0", duration: 30, qty: 30 }]);
  const rx5items = JSON.stringify([{ medicineId: 2, dose: "500mg", frequency: "1-1-1", duration: 5, qty: 15 }, { medicineId: 14, dose: "10mg", frequency: "0-0-1", duration: 5, qty: 5 }]);

  await db`
    INSERT INTO prescriptions (id, patient_id, doctor_id, created_at, diagnosis, status, items, total) VALUES
      (1, 1, 2, ${now - 3*day},  'Hypertension follow-up', 'active',    ${rx1items}, 840),
      (2, 1, 2, ${now - 33*day}, 'Type 2 DM follow-up',    'completed', ${rx2items}, 810),
      (3, 2, 3, ${now - 7*day},  'Asthma exacerbation',    'active',    ${rx3items}, 1020),
      (4, 3, 2, ${now - 12*day}, 'Cardiology follow-up',   'active',    ${rx4items}, 930),
      (5, 4, 1, ${now - 1*day},  'Acute viral URI',         'active',    ${rx5items}, 150)
    ON CONFLICT (id) DO NOTHING
  `;

  await db`SELECT setval('prescriptions_id_seq', 5, true)`;
}

/* ── Row → camelCase mappers ─────────────────────────────────────────────── */

function mapDoctor(r) {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    specialty: r.specialty,
    branchId: r.branch_id,
    initials: r.initials,
    active: r.active,
    phone: r.phone || "",
  };
}

function mapMedicine(r) {
  return {
    id: r.id,
    name: r.name,
    generic: r.generic,
    company: r.company,
    unit: r.unit,
    purchasePrice: Number(r.purchase_price),
    sellingPrice: Number(r.selling_price),
    stock: r.stock,
    lowStockAt: r.low_stock_at,
    batchNo: r.batch_no,
    expiry: Number(r.expiry),
    barcode: r.barcode,
    sold30d: r.sold_30d,
  };
}

function mapPatient(r) {
  return {
    id: r.id,
    mrn: r.mrn,
    fullName: r.full_name,
    age: r.age,
    gender: r.gender,
    phone: r.phone,
    email: r.email,
    address: r.address,
    bloodGroup: r.blood_group,
    allergies: r.allergies || [],
    chronic: r.chronic || [],
    vaccinations: r.vaccinations || [],
    branchId: r.branch_id,
    doctorId: r.doctor_id,
    diagnosis: r.diagnosis,
    lastVisitAt: Number(r.last_visit_at),
    createdAt: Number(r.created_at),
    notes: r.notes,
    family: r.family || {},
    visits: r.visits || [],
  };
}

function mapPrescription(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    createdAt: Number(r.created_at),
    diagnosis: r.diagnosis,
    status: r.status,
    items: r.items || [],
    total: Number(r.total),
  };
}

/* ── Auth accounts (in-memory, no DB) ────────────────────────────────────── */

const DEMO_ACCOUNTS = [
  { email: "admin@clinicpulse.app",   password: "demo1234", role: "admin",        fullName: "Dr. Sara Khan",      avatarUrl: "" },
  { email: "doctor@clinicpulse.app",  password: "demo1234", role: "doctor",       fullName: "Dr. Adeel Rahman",   avatarUrl: "" },
  { email: "doctor2@clinicpulse.app", password: "demo1234", role: "doctor",       fullName: "Dr. Hina Saeed",     avatarUrl: "" },
  { email: "doctor3@clinicpulse.app", password: "demo1234", role: "doctor",       fullName: "Dr. Faisal Mahmood", avatarUrl: "" },
  { email: "front@clinicpulse.app",   password: "demo1234", role: "receptionist", fullName: "Maria Lopez",        avatarUrl: "" },
  { email: "pharm@clinicpulse.app",   password: "demo1234", role: "pharmacist",   fullName: "Imran Yousaf",       avatarUrl: "" },
  { email: "patient@clinicpulse.app", password: "demo1234", role: "patient",      fullName: "Ali Hassan",         avatarUrl: "" },
];

const resetCodes = new Map();

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(data));
}

function makeToken(account) {
  return Buffer.from(JSON.stringify({ email: account.email, role: account.role, t: Date.now() })).toString("base64url");
}

function makeResetCode(email) {
  const digits = Buffer.from(`${email}:${Date.now()}`).toString("base64url").replace(/[^0-9]/g, "");
  return (digits + "246810").slice(0, 6);
}

function parsePath(path) {
  const m = path.match(/\/api\/([^/?]+)(?:\/([^/?]+))?/);
  if (!m) return { route: null, id: null };
  return { route: m[1], id: m[2] ?? null };
}

/* ── Main handler ────────────────────────────────────────────────────────── */

export default async function handler(req, res) {
  const url = new URL(req.url || "/", "https://clinicpulse.local");
  const rewrittenPath = url.searchParams.get("path");
  const path = rewrittenPath ? `/api/${rewrittenPath}` : url.pathname;
  const method = (req.method || "GET").toUpperCase();
  const body = getBody(req);

  // OPTIONS preflight
  if (method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.statusCode = 204;
    return res.end();
  }

  // Auth routes don't need DB
  if (method === "POST" && path.endsWith("/api/auth/login")) {
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email && a.password === password);
    if (!account) return send(res, 401, { error: "Invalid email or password" });
    return send(res, 200, {
      token: makeToken(account),
      user: { email: account.email, role: account.role, fullName: account.fullName, avatarUrl: account.avatarUrl },
    });
  }

  if (method === "POST" && path.endsWith("/api/auth/password/request")) {
    const email = normalizeEmail(body.email);
    if (!email || !email.includes("@")) return send(res, 400, { error: "A valid email is required." });
    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    if (account) {
      resetCodes.set(email, { code: makeResetCode(email), expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });
    }
    return send(res, 200, { ok: true, message: "If an account exists, a reset code has been sent.", expiresInMinutes: 15 });
  }

  if (method === "POST" && path.endsWith("/api/auth/password/reset")) {
    const email = normalizeEmail(body.email);
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !code || newPassword.length < 8) {
      return send(res, 400, { error: "Email, reset code, and a password of at least 8 characters are required." });
    }
    const reset = resetCodes.get(email);
    if (!reset || reset.expiresAt < Date.now()) { resetCodes.delete(email); return send(res, 400, { error: "Reset code is invalid or expired." }); }
    if (reset.attempts >= 5) { resetCodes.delete(email); return send(res, 429, { error: "Too many reset attempts." }); }
    if (reset.code !== code) { reset.attempts += 1; return send(res, 400, { error: "Reset code is invalid." }); }
    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    if (account) account.password = newPassword;
    resetCodes.delete(email);
    return send(res, 200, { ok: true, message: "Password updated." });
  }

  if (method === "POST" && path.endsWith("/api/auth/signup")) {
    const email = normalizeEmail(body.email);
    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "doctor");
    if (!email || !fullName) return send(res, 400, { error: "email and fullName required" });
    return send(res, 200, { ok: true, user: { email, fullName, role } });
  }

  if (method === "GET" && path.endsWith("/api/auth/me")) {
    return send(res, 200, { user: DEMO_ACCOUNTS[0] });
  }

  // All other routes require DB
  try {
    await initDb();
  } catch (err) {
    console.error("DB init error:", err);
    return send(res, 503, { error: "Database unavailable: " + err.message });
  }

  const db = getDb();

  /* ── Health ── */
  if (method === "GET" && path.endsWith("/api/health")) {
    try {
      const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM patients`;
      return send(res, 200, { ok: true, app: "ClinicPulse", runtime: "vercel", patients: count, db: "postgres" });
    } catch (err) {
      return send(res, 200, { ok: true, app: "ClinicPulse", runtime: "vercel", db: "error: " + err.message });
    }
  }

  const { route, id } = parsePath(path);

  /* ── Patients ── */
  if (route === "patients") {
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM patients ORDER BY id`;
        return send(res, 200, { patients: rows.map(mapPatient) });
      }

      if (method === "GET" && id) {
        const [p] = await db`SELECT * FROM patients WHERE id = ${parseInt(id)}`;
        if (!p) return send(res, 404, { error: "Patient not found" });
        return send(res, 200, { patient: mapPatient(p) });
      }

      if (method === "POST") {
        const fullName = String(body.fullName || "Unknown").trim();
        const [p] = await db`
          INSERT INTO patients (
            full_name, age, gender, phone, email, address, blood_group,
            allergies, chronic, vaccinations, branch_id, doctor_id,
            diagnosis, last_visit_at, created_at, notes, family, visits
          ) VALUES (
            ${fullName},
            ${body.age || 30},
            ${body.gender || "M"},
            ${body.phone || ""},
            ${body.email || ""},
            ${body.address || ""},
            ${body.bloodGroup || "O+"},
            ${JSON.stringify(body.allergies || [])},
            ${JSON.stringify(body.chronic || [])},
            ${JSON.stringify(body.vaccinations || [])},
            ${body.branchId || 1},
            ${body.doctorId || null},
            ${body.diagnosis || "New registration"},
            ${Date.now()},
            ${Date.now()},
            ${body.notes || ""},
            ${JSON.stringify(body.family || {})},
            ${JSON.stringify([])}
          )
          RETURNING *
        `;
        // Update MRN to match id
        const [updated] = await db`
          UPDATE patients SET mrn = ${'CP-' + (2000 + p.id)} WHERE id = ${p.id} RETURNING *
        `;
        return send(res, 201, { patient: mapPatient(updated) });
      }

      if (method === "PATCH" && id) {
        const pid = parseInt(id);
        const [existing] = await db`SELECT * FROM patients WHERE id = ${pid}`;
        if (!existing) return send(res, 404, { error: "Patient not found" });

        const fields = {};
        if (body.fullName !== undefined)   fields.full_name    = body.fullName;
        if (body.age !== undefined)        fields.age          = body.age;
        if (body.gender !== undefined)     fields.gender       = body.gender;
        if (body.phone !== undefined)      fields.phone        = body.phone;
        if (body.email !== undefined)      fields.email        = body.email;
        if (body.address !== undefined)    fields.address      = body.address;
        if (body.bloodGroup !== undefined) fields.blood_group  = body.bloodGroup;
        if (body.allergies !== undefined)  fields.allergies    = JSON.stringify(body.allergies);
        if (body.chronic !== undefined)    fields.chronic      = JSON.stringify(body.chronic);
        if (body.vaccinations !== undefined) fields.vaccinations = JSON.stringify(body.vaccinations);
        if (body.doctorId !== undefined)   fields.doctor_id    = body.doctorId;
        if (body.diagnosis !== undefined)  fields.diagnosis    = body.diagnosis;
        if (body.lastVisitAt !== undefined) fields.last_visit_at = body.lastVisitAt;
        if (body.notes !== undefined)      fields.notes        = body.notes;
        if (body.family !== undefined)     fields.family       = JSON.stringify(body.family);
        if (body.visits !== undefined)     fields.visits       = JSON.stringify(body.visits);

        if (Object.keys(fields).length === 0) {
          return send(res, 200, { patient: mapPatient(existing) });
        }

        const [updated] = await db`
          UPDATE patients SET ${db(fields)} WHERE id = ${pid} RETURNING *
        `;
        return send(res, 200, { patient: mapPatient(updated) });
      }

      // Single delete
      if (method === "DELETE" && id) {
        const pid = parseInt(id);
        // prescriptions cascade via FK ON DELETE CASCADE
        await db`DELETE FROM patients WHERE id = ${pid}`;
        return send(res, 200, { ok: true, deleted: pid });
      }

      // Bulk delete
      if (method === "DELETE" && !id) {
        const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean) : [];
        if (ids.length === 0) return send(res, 200, { ok: true, deleted: [] });
        // prescriptions cascade via FK ON DELETE CASCADE
        await db`DELETE FROM patients WHERE id = ANY(${ids}::int[])`;
        return send(res, 200, { ok: true, deleted: ids });
      }
    } catch (err) {
      console.error("patients error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Prescriptions ── */
  if (route === "prescriptions") {
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM prescriptions ORDER BY id`;
        return send(res, 200, { prescriptions: rows.map(mapPrescription) });
      }

      if (method === "GET" && id) {
        const [rx] = await db`SELECT * FROM prescriptions WHERE id = ${parseInt(id)}`;
        if (!rx) return send(res, 404, { error: "Prescription not found" });
        return send(res, 200, { prescription: mapPrescription(rx) });
      }

      if (method === "POST") {
        const [rx] = await db`
          INSERT INTO prescriptions (patient_id, doctor_id, created_at, diagnosis, status, items, total)
          VALUES (
            ${body.patientId || null},
            ${body.doctorId || null},
            ${Date.now()},
            ${body.diagnosis || ""},
            ${body.status || "active"},
            ${JSON.stringify(body.items || [])},
            ${body.total || 0}
          )
          RETURNING *
        `;
        return send(res, 201, { prescription: mapPrescription(rx) });
      }

      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM prescriptions WHERE id = ${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Prescription not found" });

        const fields = {};
        if (body.diagnosis !== undefined) fields.diagnosis  = body.diagnosis;
        if (body.status !== undefined)    fields.status     = body.status;
        if (body.items !== undefined)     fields.items      = JSON.stringify(body.items);
        if (body.total !== undefined)     fields.total      = body.total;
        if (body.doctorId !== undefined)  fields.doctor_id  = body.doctorId;

        if (Object.keys(fields).length === 0) {
          return send(res, 200, { prescription: mapPrescription(existing) });
        }

        const [updated] = await db`
          UPDATE prescriptions SET ${db(fields)} WHERE id = ${parseInt(id)} RETURNING *
        `;
        return send(res, 200, { prescription: mapPrescription(updated) });
      }
    } catch (err) {
      console.error("prescriptions error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Medicines ── */
  if (route === "medicines") {
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM medicines ORDER BY id`;
        return send(res, 200, { medicines: rows.map(mapMedicine) });
      }

      if (method === "POST") {
        const [m] = await db`
          INSERT INTO medicines (
            name, generic, company, unit, purchase_price, selling_price,
            stock, low_stock_at, batch_no, expiry, barcode, sold_30d
          ) VALUES (
            ${body.name || ""},
            ${body.generic || ""},
            ${body.company || ""},
            ${body.unit || "tab"},
            ${body.purchasePrice || 0},
            ${body.sellingPrice || 0},
            ${body.stock || 0},
            ${body.lowStockAt || 25},
            ${body.batchNo || ""},
            ${body.expiry || 0},
            ${body.barcode || ""},
            ${body.sold30d || 0}
          )
          RETURNING *
        `;
        return send(res, 201, { medicine: mapMedicine(m) });
      }

      if (method === "DELETE" && id) {
        await db`DELETE FROM medicines WHERE id = ${parseInt(id)}`;
        return send(res, 200, { ok: true });
      }
    } catch (err) {
      console.error("medicines error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Doctors ── */
  if (route === "doctors") {
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM doctors ORDER BY id`;
        return send(res, 200, { doctors: rows.map(mapDoctor) });
      }

      if (method === "POST") {
        const fullName = String(body.fullName || "").trim();
        const initials = body.initials ||
          fullName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

        const [d] = await db`
          INSERT INTO doctors (email, full_name, specialty, branch_id, initials, active, phone)
          VALUES (
            ${body.email || ""},
            ${fullName},
            ${body.specialty || "General Practice"},
            ${body.branchId || 1},
            ${initials},
            ${body.active !== false},
            ${body.phone || ""}
          )
          RETURNING *
        `;
        return send(res, 201, { doctor: mapDoctor(d) });
      }

      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM doctors WHERE id = ${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Doctor not found" });

        const fields = {};
        if (body.email !== undefined)     fields.email     = body.email;
        if (body.fullName !== undefined)  fields.full_name = body.fullName;
        if (body.specialty !== undefined) fields.specialty = body.specialty;
        if (body.initials !== undefined)  fields.initials  = body.initials;
        if (body.active !== undefined)    fields.active    = body.active;
        if (body.phone !== undefined)     fields.phone     = body.phone;

        if (Object.keys(fields).length === 0) {
          return send(res, 200, { doctor: mapDoctor(existing) });
        }

        const [updated] = await db`
          UPDATE doctors SET ${db(fields)} WHERE id = ${parseInt(id)} RETURNING *
        `;
        return send(res, 200, { doctor: mapDoctor(updated) });
      }
    } catch (err) {
      console.error("doctors error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  return send(res, 404, { error: "API route not found" });
}
