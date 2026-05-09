/**
 * ClinicPulse — Vercel Serverless API Handler (Postgres-backed, production)
 *
 * All routes hit Postgres via POSTGRES_URL (Neon-compatible).
 * initDb() runs on each cold start: CREATE TABLE IF NOT EXISTS + seed if empty.
 * Auth: DB-backed users table with scrypt-hashed passwords (Node built-in crypto).
 *
 * Routes:
 *   POST /api/auth/login                          → { token, user }
 *   POST /api/auth/signup                         → { ok, user }
 *   POST /api/auth/password/request               → request reset code (kept in DB)
 *   POST /api/auth/password/reset                 → finish reset (with code)
 *   POST /api/auth/password/admin-reset           → admin sets a user's password
 *   GET  /api/auth/me                             → resolve current user from token
 *   GET  /api/users                               → admin: list users
 *   GET  /api/health
 *
 *   GET    /api/patients
 *   POST   /api/patients
 *   GET    /api/patients/:id
 *   PATCH  /api/patients/:id
 *   DELETE /api/patients/:id
 *   DELETE /api/patients          (bulk: { ids: number[] })
 *
 *   GET    /api/prescriptions
 *   POST   /api/prescriptions
 *   GET    /api/prescriptions/:id
 *   PATCH  /api/prescriptions/:id
 *   DELETE /api/prescriptions/:id
 *
 *   GET    /api/medicines
 *   POST   /api/medicines
 *   PATCH  /api/medicines/:id
 *   DELETE /api/medicines/:id
 *
 *   GET    /api/doctors
 *   POST   /api/doctors           (also creates linked user with temp password)
 *   PATCH  /api/doctors/:id
 *   DELETE /api/doctors/:id
 *
 *   GET    /api/appointments      (?from=&to= optional ms timestamps)
 *   POST   /api/appointments
 *   PATCH  /api/appointments/:id
 *   DELETE /api/appointments/:id
 *
 *   GET    /api/payments
 *   POST   /api/payments
 *   PATCH  /api/payments/:id
 *   DELETE /api/payments/:id
 *
 *   GET    /api/settings
 *   PATCH  /api/settings
 */

import postgres from "postgres";
import crypto from "crypto";

/* ── Postgres connection ──────────────────────────────────────────────────── */

let sql;
function getDb() {
  if (!sql) {
    if (!process.env.POSTGRES_URL) {
      throw new Error(
        "POSTGRES_URL environment variable is not set. Configure it in your Vercel project settings."
      );
    }
    // Honour sslmode=disable in the URL (useful for local Postgres testing).
    const url = process.env.POSTGRES_URL;
    const disableSsl = /sslmode=disable/i.test(url) || /\/\/[^/]*localhost/i.test(url) || /\/\/[^/]*127\.0\.0\.1/i.test(url);
    sql = postgres(url, {
      ssl: disableSsl ? false : "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 30,
    });
  }
  return sql;
}

/* ── Password hashing (scrypt — Node built-in, no deps) ───────────────────── */

const SCRYPT_KEYLEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(plain), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

function verifyPassword(plain, stored) {
  if (!stored) return false;
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    const derived = crypto.scryptSync(String(plain), salt, expected.length, { N, r, p });
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function genTempPassword(len = 12) {
  // base32-ish alphabet, no ambiguous chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/* ── DB init flag ─────────────────────────────────────────────────────────── */

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;
  const db = getDb();

  // Doctors
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

  // Users (DB-backed authentication)
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT NOT NULL DEFAULT '',
      role            TEXT NOT NULL DEFAULT 'doctor',
      full_name       TEXT NOT NULL DEFAULT '',
      initials        TEXT NOT NULL DEFAULT '',
      branch_id       INTEGER NOT NULL DEFAULT 1,
      specialty       TEXT,
      active          BOOLEAN NOT NULL DEFAULT true,
      doctor_id       INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      reset_code      TEXT,
      reset_expires   BIGINT NOT NULL DEFAULT 0,
      reset_attempts  INTEGER NOT NULL DEFAULT 0,
      must_change     BOOLEAN NOT NULL DEFAULT false,
      created_at      BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      last_login_at   BIGINT NOT NULL DEFAULT 0
    )
  `;

  // Medicines
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
      tablets_per_pack INTEGER NOT NULL DEFAULT 10,
      tablets_sold     INTEGER NOT NULL DEFAULT 0,
      created_at     BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  // Migrations for previously-deployed DBs that don't yet have these columns
  await db`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS tablets_per_pack INTEGER NOT NULL DEFAULT 10`;
  await db`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS tablets_sold     INTEGER NOT NULL DEFAULT 0`;

  // Patients (doctor_id SET NULL on doctor delete)
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

  // Prescriptions
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

  // Appointments
  await db`
    CREATE TABLE IF NOT EXISTS appointments (
      id            SERIAL PRIMARY KEY,
      patient_id    INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id     INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      branch_id     INTEGER NOT NULL DEFAULT 1,
      scheduled_at  BIGINT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'scheduled',
      token         INTEGER NOT NULL DEFAULT 1,
      reason        TEXT NOT NULL DEFAULT 'Consultation',
      channel       TEXT NOT NULL DEFAULT 'walk_in',
      notes         TEXT NOT NULL DEFAULT '',
      created_at    BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  // Payments
  await db`
    CREATE TABLE IF NOT EXISTS payments (
      id              SERIAL PRIMARY KEY,
      patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
      amount          NUMERIC NOT NULL DEFAULT 0,
      method          TEXT NOT NULL DEFAULT 'Cash',
      status          TEXT NOT NULL DEFAULT 'paid',
      invoice_no      TEXT NOT NULL DEFAULT '',
      created_at      BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  // Settings (single-row id=1)
  await db`
    CREATE TABLE IF NOT EXISTS settings (
      id               INTEGER PRIMARY KEY DEFAULT 1,
      clinic_name      TEXT NOT NULL DEFAULT 'ClinicPulse Health',
      clinic_slug      TEXT NOT NULL DEFAULT 'clinicpulse-health',
      currency         TEXT NOT NULL DEFAULT 'PKR (₨)',
      timezone         TEXT NOT NULL DEFAULT 'Asia/Karachi',
      notif_email      BOOLEAN NOT NULL DEFAULT true,
      notif_sms        BOOLEAN NOT NULL DEFAULT false,
      notif_wa         BOOLEAN NOT NULL DEFAULT true,
      notif_push       BOOLEAN NOT NULL DEFAULT true,
      updated_at       BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    )
  `;

  // Seed if empty (doctors first)
  const [{ count: doctorCount }] = await db`SELECT COUNT(*)::int AS count FROM doctors`;
  if (doctorCount === 0) await seedDoctorsAndMedicinesAndPatients(db);

  // Seed users if empty (always after doctors so doctor_id FK resolves)
  const [{ count: userCount }] = await db`SELECT COUNT(*)::int AS count FROM users`;
  if (userCount === 0) await seedUsers(db);

  // ── Convergence: ensure the canonical doctor roster is in place ──────────
  // Upsert Dr. Muhammad Usman as doctor id=1 (admin)
  await db`
    INSERT INTO doctors (id, email, full_name, specialty, branch_id, initials, active, phone)
    VALUES (1, 'admin@clinicpulse.app', 'Dr. Muhammad Usman', 'Internal Medicine', 1, 'MU', true, '+92 300 1234501')
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      specialty  = EXCLUDED.specialty,
      initials   = EXCLUDED.initials,
      active     = EXCLUDED.active
  `;
  // Upsert Dr. Mahroona Laraib as doctor id=2
  await db`
    INSERT INTO doctors (id, email, full_name, specialty, branch_id, initials, active, phone)
    VALUES (2, 'doctor@clinicpulse.app', 'Dr. Mahroona Laraib', 'General Practice', 1, 'ML', true, '+92 300 1234502')
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      specialty  = EXCLUDED.specialty,
      initials   = EXCLUDED.initials,
      active     = EXCLUDED.active
  `;
  // Update linked user accounts to match new names
  await db`UPDATE users SET full_name = 'Dr. Muhammad Usman',  initials = 'MU', specialty = 'Internal Medicine', role = 'admin'  WHERE email = 'admin@clinicpulse.app'`;
  await db`UPDATE users SET full_name = 'Dr. Mahroona Laraib', initials = 'ML', specialty = 'General Practice',  role = 'doctor' WHERE email = 'doctor@clinicpulse.app'`;
  // Ensure doctor_id FK linkage is correct
  await db`UPDATE users SET doctor_id = 1 WHERE email = 'admin@clinicpulse.app'  AND (doctor_id IS NULL OR doctor_id != 1)`;
  await db`UPDATE users SET doctor_id = 2 WHERE email = 'doctor@clinicpulse.app' AND (doctor_id IS NULL OR doctor_id != 2)`;
  // Remove stale doctor2/doctor3 user accounts (doctor-role only, preserve non-doctor users)
  await db`DELETE FROM users WHERE email IN ('doctor2@clinicpulse.app','doctor3@clinicpulse.app') AND role = 'doctor'`;
  // Reroute any prescriptions/appointments/patients pointing at removed doctors (id>=3) → doctor id=2
  await db`UPDATE prescriptions SET doctor_id = 2 WHERE doctor_id > 2`;
  await db`UPDATE appointments  SET doctor_id = 2 WHERE doctor_id > 2`;
  await db`UPDATE patients      SET doctor_id = 2 WHERE doctor_id > 2`;
  // Delete extra doctor rows (ids 3+) — ON DELETE SET NULL already handles FKs in patients/prescriptions/appointments
  await db`DELETE FROM doctors WHERE id > 2`;
  // ── End convergence ─────────────────────────────────────────────────────

  // Ensure settings row exists
  await db`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

  dbInitialized = true;
}

/* ── Seed data ────────────────────────────────────────────────────────────── */

async function seedDoctorsAndMedicinesAndPatients(db) {
  const now = Date.now();
  const day = 86_400_000;

  await db`
    INSERT INTO doctors (id, email, full_name, specialty, branch_id, initials, active, phone) VALUES
      (1, 'admin@clinicpulse.app',  'Dr. Muhammad Usman',  'Internal Medicine', 1, 'MU', true, '+92 300 1234501'),
      (2, 'doctor@clinicpulse.app', 'Dr. Mahroona Laraib', 'General Practice',  1, 'ML', true, '+92 300 1234502')
    ON CONFLICT (id) DO NOTHING
  `;
  await db`SELECT setval('doctors_id_seq', 2, true)`;

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

  // Patients (one visit each minimum)
  const p1v = JSON.stringify([
    { id: 1, date: now - 3*day, doctorId: 2, diagnosis: "Hypertension follow-up", soap: { s: "Patient reports occasional headache and fatigue for 4 days.", o: "BP 148/92 mmHg · HR 78 bpm · Temp 36.8°C · SpO₂ 98%", a: "Essential Hypertension — partially controlled", p: "Continued Telmisartan 40mg OD, Amlodipine 5mg OD. Follow-up in 14 days." } },
  ]);
  const p2v = JSON.stringify([
    { id: 1, date: now - 7*day, doctorId: 2, diagnosis: "Asthma exacerbation", soap: { s: "Wheezing and shortness of breath for 2 days.", o: "BP 118/76 · HR 92 · SpO₂ 94% · Peak flow 68% predicted", a: "Mild persistent asthma — acute exacerbation", p: "Salbutamol PRN. Montelukast 10mg OD added." } },
  ]);
  const p3v = JSON.stringify([
    { id: 1, date: now - 12*day, doctorId: 2, diagnosis: "Cardiology follow-up", soap: { s: "Mild chest tightness on exertion.", o: "BP 152/96 · HR 68 · SpO₂ 97% · ECG sinus rhythm", a: "HTN with hyperlipidemia", p: "Atenolol 50mg OD continued. Atorvastatin 20mg added. Aspirin 75mg." } },
  ]);
  const p4v = JSON.stringify([
    { id: 1, date: now - 1*day, doctorId: 1, diagnosis: "Acute viral URI", soap: { s: "Sore throat, runny nose, mild fever for 3 days.", o: "BP 112/72 · HR 84 · Temp 37.6°C · SpO₂ 99%", a: "Acute viral URI", p: "Panadol Extra TDS × 5 days. Loratadine 10mg OD × 5 days." } },
  ]);

  await db`
    INSERT INTO patients (id, mrn, full_name, age, gender, phone, email, address, blood_group, allergies, chronic, vaccinations, branch_id, doctor_id, diagnosis, last_visit_at, created_at, notes, family, visits) VALUES
      (1,'CP-2001','Ali Hassan',  45,'M','+92 300 1234567','ali.hassan@mail.com',  '14-B, Gulberg III, Lahore',   'O+', ${JSON.stringify(["Penicillin"])}, ${JSON.stringify(["Hypertension","Type 2 Diabetes"])}, ${JSON.stringify(["Hep B","Influenza '24","COVID-19 booster"])},1,2,'Hypertension follow-up',${now-3*day}, ${now-420*day},'Patient prefers morning appointments. Compliant with therapy.',${JSON.stringify({mother:"Hypertension",father:"Type 2 Diabetes"})},${p1v}),
      (2,'CP-2002','Maryam Iqbal',32,'F','+92 321 9876543','maryam.iqbal@mail.com','7-C, DHA Phase 4, Karachi',   'A+', ${JSON.stringify([])},             ${JSON.stringify(["Asthma"])},                         ${JSON.stringify(["Hep B","Tdap","COVID-19 booster"])},          1,2,'Asthma exacerbation',   ${now-7*day}, ${now-200*day},'',${JSON.stringify({mother:"Asthma"})},${p2v}),
      (3,'CP-2003','Hamza Khan',  58,'M','+92 333 5556677','hamza.khan@mail.com',  '22-A, F-7 Markaz, Islamabad', 'B+', ${JSON.stringify(["NSAIDs"])},       ${JSON.stringify(["Hypertension","Hyperlipidemia"])},   ${JSON.stringify(["Hep B","Influenza '24"])},                    1,2,'Cardiology follow-up',  ${now-12*day},${now-600*day},'Patient is a retired civil servant. Good compliance.',${JSON.stringify({father:"Hypertension",mother:"Hyperlipidemia"})},${p3v}),
      (4,'CP-2004','Sara Ahmed',  27,'F','+92 312 3334455','sara.ahmed@mail.com',  '5-D, Bahria Town, Rawalpindi','AB-',${JSON.stringify(["Sulfa"])},        ${JSON.stringify([])},                                 ${JSON.stringify(["Hep B","Tdap","COVID-19 booster","Influenza '24"])},1,1,'Acute viral URI',   ${now-1*day}, ${now-30*day}, '',${JSON.stringify({})},${p4v})
    ON CONFLICT (id) DO NOTHING
  `;
  await db`SELECT setval('patients_id_seq', 4, true)`;

  // Prescriptions
  const rx1i = JSON.stringify([{medicineId:6,dose:"40mg",frequency:"1-0-0",duration:30,qty:30},{medicineId:25,dose:"5mg",frequency:"1-0-0",duration:30,qty:30},{medicineId:3,dose:"500mg",frequency:"1-0-1",duration:30,qty:60}]);
  const rx2i = JSON.stringify([{medicineId:3,dose:"500mg",frequency:"1-0-1",duration:30,qty:60},{medicineId:4,dose:"1g",frequency:"0-0-1",duration:30,qty:30}]);
  const rx3i = JSON.stringify([{medicineId:9,dose:"100mcg",frequency:"PRN",duration:30,qty:1},{medicineId:10,dose:"10mg",frequency:"0-0-1",duration:30,qty:30}]);
  const rx4i = JSON.stringify([{medicineId:5,dose:"50mg",frequency:"1-0-0",duration:30,qty:30},{medicineId:7,dose:"20mg",frequency:"0-0-1",duration:30,qty:30},{medicineId:21,dose:"75mg",frequency:"1-0-0",duration:30,qty:30}]);
  const rx5i = JSON.stringify([{medicineId:2,dose:"500mg",frequency:"1-1-1",duration:5,qty:15},{medicineId:14,dose:"10mg",frequency:"0-0-1",duration:5,qty:5}]);

  await db`
    INSERT INTO prescriptions (id, patient_id, doctor_id, created_at, diagnosis, status, items, total) VALUES
      (1,1,2,${now-3*day}, 'Hypertension follow-up','active',   ${rx1i},840),
      (2,1,2,${now-33*day},'Type 2 DM follow-up',   'completed',${rx2i},810),
      (3,2,2,${now-7*day}, 'Asthma exacerbation',   'active',   ${rx3i},1020),
      (4,3,2,${now-12*day},'Cardiology follow-up',  'active',   ${rx4i},930),
      (5,4,1,${now-1*day}, 'Acute viral URI',        'active',   ${rx5i},150)
    ON CONFLICT (id) DO NOTHING
  `;
  await db`SELECT setval('prescriptions_id_seq', 5, true)`;

  // Sample appointments — today across the 4 patients
  const today = new Date(); today.setHours(9, 0, 0, 0);
  const t = today.getTime();
  await db`
    INSERT INTO appointments (patient_id, doctor_id, branch_id, scheduled_at, status, token, reason, channel) VALUES
      (1, 2, 1, ${t},               'scheduled',  1, 'Hypertension follow-up', 'walk_in'),
      (2, 2, 1, ${t + 30*60*1000},  'scheduled',  2, 'Asthma review',          'phone'),
      (3, 2, 1, ${t + 60*60*1000},  'scheduled',  3, 'Cardiology follow-up',   'online'),
      (4, 1, 1, ${t + 90*60*1000},  'scheduled',  4, 'URI follow-up',          'walk_in')
  `;

  // Sample payments matching prescriptions
  await db`
    INSERT INTO payments (patient_id, prescription_id, amount, method, status, invoice_no, created_at) VALUES
      (1, 1, 840,  'Cash',      'paid', 'INV-10001', ${now-3*day}),
      (1, 2, 810,  'Card',      'due',  'INV-10002', ${now-33*day}),
      (2, 3, 1020, 'JazzCash',  'paid', 'INV-10003', ${now-7*day}),
      (3, 4, 930,  'Easypaisa', 'paid', 'INV-10004', ${now-12*day}),
      (4, 5, 150,  'Cash',      'paid', 'INV-10005', ${now-1*day})
  `;
}

async function seedUsers(db) {
  // Default password for all seed users — matches existing demo expectation.
  const defaultHash = hashPassword("demo1234");

  // Map seed users to doctors so doctor logins work and doctor_id is set.
  const seeds = [
    { email: "admin@clinicpulse.app",  role: "admin",        fullName: "Dr. Muhammad Usman",  initials: "MU", specialty: "Internal Medicine", doctor_id: 1 },
    { email: "doctor@clinicpulse.app", role: "doctor",       fullName: "Dr. Mahroona Laraib", initials: "ML", specialty: "General Practice",  doctor_id: 2 },
    { email: "front@clinicpulse.app",  role: "receptionist", fullName: "Maria Lopez",         initials: "ML", specialty: null,                doctor_id: null },
    { email: "pharm@clinicpulse.app",  role: "pharmacist",   fullName: "Imran Yousaf",        initials: "IY", specialty: null,                doctor_id: null },
    { email: "patient@clinicpulse.app",role: "patient",      fullName: "Ali Hassan",          initials: "AH", specialty: null,                doctor_id: null },
  ];
  for (const u of seeds) {
    await db`
      INSERT INTO users (email, password_hash, role, full_name, initials, branch_id, specialty, active, doctor_id)
      VALUES (${u.email}, ${defaultHash}, ${u.role}, ${u.fullName}, ${u.initials}, 1, ${u.specialty}, true, ${u.doctor_id})
      ON CONFLICT (email) DO NOTHING
    `;
  }
}

/* ── Row mappers ─────────────────────────────────────────────────────────── */

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
  // Pack-based prices map to existing purchase_price/selling_price columns.
  // Per-tablet economics are derived from tabletsPerPack so the existing schema
  // and seed values keep working without migration of values.
  const tabletsPerPack = Number(r.tablets_per_pack ?? 10) || 1;
  const costPerPack    = Number(r.purchase_price);
  const salePerPack    = Number(r.selling_price);
  const tabletsSold    = Number(r.tablets_sold ?? 0);
  const costPerTablet  = costPerPack / tabletsPerPack;
  const pricePerTablet = salePerPack / tabletsPerPack;
  const revenue        = tabletsSold * pricePerTablet;
  const profit         = tabletsSold * (pricePerTablet - costPerTablet);
  return {
    id: r.id,
    name: r.name,
    generic: r.generic,
    company: r.company,
    unit: r.unit,
    purchasePrice: costPerPack,
    sellingPrice: salePerPack,
    // Friendly aliases for tablet-based UI:
    costPerPack,
    salePricePerPack: salePerPack,
    pricePerTablet:   Number.isFinite(pricePerTablet) ? Math.round(pricePerTablet * 100) / 100 : 0,
    costPerTablet:    Number.isFinite(costPerTablet)  ? Math.round(costPerTablet  * 100) / 100 : 0,
    tabletsPerPack,
    tabletsSold,
    revenue:          Math.round(revenue * 100) / 100,
    profit:           Math.round(profit  * 100) / 100,
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
  let items = r.items || [];
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return {
    id: r.id,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    createdAt: Number(r.created_at),
    diagnosis: r.diagnosis,
    status: r.status,
    items: Array.isArray(items) ? items : [],
    total: Number(r.total),
  };
}

function mapAppointment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    branchId: r.branch_id,
    scheduledAt: Number(r.scheduled_at),
    status: r.status,
    token: r.token,
    reason: r.reason,
    channel: r.channel,
    notes: r.notes || "",
  };
}

function mapPayment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    prescriptionId: r.prescription_id,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    invoiceNo: r.invoice_no,
    createdAt: Number(r.created_at),
  };
}

function mapUser(r) {
  return {
    id: r.id,
    email: r.email,
    role: r.role,
    fullName: r.full_name,
    initials: r.initials,
    branchId: r.branch_id,
    specialty: r.specialty,
    active: r.active,
    doctorId: r.doctor_id,
    mustChange: r.must_change,
    lastLoginAt: Number(r.last_login_at),
  };
}

function mapSettings(r) {
  return {
    clinicName:  r.clinic_name,
    clinicSlug:  r.clinic_slug,
    currency:    r.currency,
    timezone:    r.timezone,
    notifEmail:  r.notif_email,
    notifSms:    r.notif_sms,
    notifWa:     r.notif_wa,
    notifPush:   r.notif_push,
    updatedAt:   Number(r.updated_at),
  };
}

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.end(JSON.stringify(data));
}

function makeToken(account) {
  return Buffer.from(JSON.stringify({
    id: account.id, email: account.email, role: account.role, t: Date.now(),
  })).toString("base64url");
}

function parseToken(token) {
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch { return null; }
}

function readToken(req) {
  const auth = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  if (m) return parseToken(m[1]);
  return null;
}

function makeResetCode() {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ── Prescription tablet calculator ──────────────────────────────────────── */

/**
 * Parse the number of tablets/capsules a prescription line will consume.
 *
 * Frequency parsing handles standard medical abbreviations:
 *   OD/QD/QAM/QPM/HS/Night = 1/day, BD/BID = 2/day, TDS/TID = 3/day,
 *   QID/QDS = 4/day, Q4H = 6/day, Q6H = 4/day, Q8H = 3/day, Q12H = 2/day,
 *   PRN/SOS/STAT = 0 (not counted unless dose has explicit qty).
 * Numeric "1-0-1" style strings sum digits.
 *
 * Dose parsing only counts tablet/cap/capsule units (e.g. "1 tablet", "1/2 tab",
 *   "0.5 tablet", "2 tablets"). If no tablet keyword is found in `dose`, but the
 *   medicine `unit` is tab/cap, we default to 1 tablet per dose. For non-tablet
 *   units (ml, sachet, inhaler, syrup) we return 0 — those don't deduct tablets.
 *
 * Duration parsing accepts:
 *   number `duration` (treated as days), "5 day(s)", "1 week", "2 wks", "1 month".
 */
function calcDosesPerDay(freq) {
  if (freq == null) return 0;
  const s = String(freq).trim().toLowerCase();
  if (!s) return 0;
  if (/^prn$|^sos$|^stat$/.test(s)) return 0;
  // Numeric x-y-z pattern
  if (/^[\d.]+(?:\s*[-/+]\s*[\d.]+)+$/.test(s)) {
    return s.split(/[-/+]/).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  // Q4H / Q6H / Q8H / Q12H
  const qm = s.match(/q\s*(\d+)\s*h/);
  if (qm) {
    const hrs = parseInt(qm[1]);
    if (hrs > 0) return Math.max(1, Math.round(24 / hrs));
  }
  if (/\bqid\b|\bqds\b/.test(s)) return 4;
  if (/\btds\b|\btid\b/.test(s)) return 3;
  if (/\bbid\b|\bbd\b|\btwice\b/.test(s)) return 2;
  if (/\bod\b|\bqd\b|\bqam\b|\bqpm\b|\bhs\b|\bnight\b|\bonce\b|\bdaily\b/.test(s)) return 1;
  // "x times a day / per day"
  const tm = s.match(/(\d+)\s*(?:x|times)/);
  if (tm) return parseInt(tm[1]) || 0;
  return 0;
}

function calcTabletsPerDose(dose, medicineUnit) {
  if (!dose) {
    // No dose text — for tablet-like units default to 1 tablet/dose
    const u = String(medicineUnit || "").toLowerCase();
    return /^(tab|cap|capsule|tablet)/.test(u) ? 1 : 0;
  }
  const s = String(dose).toLowerCase();
  // Look for explicit tablet/capsule mention
  const tabRegex = /(\d+(?:\.\d+)?|\d+\/\d+|½|¼|¾)\s*(?:tab|tablet|cap|capsule)s?\b/;
  const m = s.match(tabRegex);
  if (m) {
    let raw = m[1];
    if (raw === "½") return 0.5;
    if (raw === "¼") return 0.25;
    if (raw === "¾") return 0.75;
    if (/\//.test(raw)) {
      const [a, b] = raw.split("/").map(Number);
      return b ? a / b : 0;
    }
    return parseFloat(raw) || 0;
  }
  // No tablet keyword: if dose looks like "5 ml" or "100mcg" but unit is tablet/cap, default 1
  if (/\bml\b|\bdrop|\bsachet|\bpuff|\binh|\bunit\b/.test(s)) return 0;
  const u = String(medicineUnit || "").toLowerCase();
  if (/^(tab|cap|capsule|tablet)/.test(u)) return 1;
  return 0;
}

function calcDurationDays(item) {
  if (item == null) return 0;
  if (typeof item.duration === "number" && item.duration > 0) return item.duration;
  const txt = String(item.duration || item.durationText || "").toLowerCase();
  if (!txt) return 0;
  const m = txt.match(/(\d+(?:\.\d+)?)\s*(day|days|d|week|weeks|wk|wks|w|month|months|mo)/);
  if (!m) {
    const n = parseFloat(txt);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(m[1]);
  const unit = m[2];
  if (/^d/.test(unit)) return n;
  if (/^w/.test(unit)) return n * 7;
  if (/^mo?/.test(unit)) return n * 30;
  return n;
}

/** Compute tablets a single prescription line will sell. Honors qty if explicitly set. */
function calcTabletsForItem(item, medicine) {
  if (!item) return 0;
  const unit = medicine?.unit ?? "tab";
  const u = String(unit).toLowerCase();
  // Non-tablet inventory items (inhalers/sachets/units) never increment tabletsSold.
  if (!/^(tab|cap|capsule|tablet)/.test(u)) return 0;
  const tabletsPerDose = calcTabletsPerDose(item.dose, unit);
  const dosesPerDay    = calcDosesPerDay(item.frequency);
  const days           = calcDurationDays(item);
  let calc = tabletsPerDose * dosesPerDay * days;
  if (!Number.isFinite(calc) || calc <= 0) {
    // Fall back to caller-provided qty if it looks like a tablet count
    const q = parseFloat(item.qty);
    if (Number.isFinite(q) && q > 0) calc = q;
  }
  return Math.max(0, Math.round(calc));
}

/** Apply a delta of tablets sold to medicines and decrement pack stock. delta>0 sells, <0 reverses. */
async function applyTabletsDelta(db, items, delta) {
  if (!Array.isArray(items) || items.length === 0) return;
  for (const it of items) {
    if (!it || it.medicineId == null) continue;
    const [med] = await db`SELECT * FROM medicines WHERE id = ${parseInt(it.medicineId)}`;
    if (!med) continue;
    const tabs = calcTabletsForItem(it, { unit: med.unit });
    if (tabs <= 0) continue;
    const dt = delta * tabs;
    const tabletsPerPack = Math.max(1, Number(med.tablets_per_pack ?? 10));
    // tablets_sold is monotonic per-medicine cumulative counter; clamp >= 0
    const newSold = Math.max(0, Number(med.tablets_sold ?? 0) + dt);
    // Pack stock deducts whole packs once a full pack has been consumed.
    // We compute the pack count from cumulative sold over packs; deduct change.
    const packsNowConsumed = Math.floor(newSold / tabletsPerPack);
    const packsPreviouslyConsumed = Math.floor(Math.max(0, Number(med.tablets_sold ?? 0)) / tabletsPerPack);
    const stockDelta = packsPreviouslyConsumed - packsNowConsumed; // negative = decrement
    const newStock = Math.max(0, Number(med.stock ?? 0) + stockDelta);
    // sold_30d is a rolling counter (kept loosely in sync).
    const newSold30d = Math.max(0, Number(med.sold_30d ?? 0) + dt);
    await db`
      UPDATE medicines
      SET tablets_sold = ${newSold},
          stock        = ${newStock},
          sold_30d     = ${newSold30d}
      WHERE id = ${med.id}
    `;
  }
}

function parsePath(path) {
  const m = path.match(/\/api\/([^/?]+)(?:\/([^/?]+))?(?:\/([^/?]+))?/);
  if (!m) return { route: null, id: null, sub: null };
  return { route: m[1] ?? null, id: m[2] ?? null, sub: m[3] ?? null };
}

/* ── Main handler ────────────────────────────────────────────────────────── */

// Exported for unit/smoke testing
export const __testables = { calcDosesPerDay, calcTabletsPerDose, calcDurationDays, calcTabletsForItem };

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

  /* ── DB init ── (auth now requires DB) */
  try {
    await initDb();
  } catch (err) {
    console.error("DB init error:", err);
    return send(res, 503, { error: "Database unavailable: " + err.message });
  }

  const db = getDb();
  const { route, id, sub } = parsePath(path);
  const tokenInfo = readToken(req);

  /* ── Auth routes ── */

  if (method === "POST" && path.endsWith("/api/auth/login")) {
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    try {
      const [u] = await db`SELECT * FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
      if (!u || !u.active || !verifyPassword(password, u.password_hash)) {
        return send(res, 401, { error: "Invalid email or password" });
      }
      await db`UPDATE users SET last_login_at = ${Date.now()} WHERE id = ${u.id}`;
      const user = mapUser(u);
      return send(res, 200, { token: makeToken(user), user });
    } catch (err) {
      console.error("login error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  if (method === "POST" && path.endsWith("/api/auth/signup")) {
    // Self-signup creates a patient-role user (basic guard against admin escalation)
    const email = normalizeEmail(body.email);
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");
    if (!email || !fullName || password.length < 8) {
      return send(res, 400, { error: "email, fullName, and password (8+ chars) are required" });
    }
    try {
      const [exists] = await db`SELECT id FROM users WHERE LOWER(email) = ${email}`;
      if (exists) return send(res, 409, { error: "An account with that email already exists." });
      const initials = fullName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
      const hash = hashPassword(password);
      const [u] = await db`
        INSERT INTO users (email, password_hash, role, full_name, initials, branch_id, active)
        VALUES (${email}, ${hash}, 'patient', ${fullName}, ${initials}, 1, true)
        RETURNING *
      `;
      return send(res, 201, { ok: true, user: mapUser(u) });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  if (method === "POST" && path.endsWith("/api/auth/password/request")) {
    const email = normalizeEmail(body.email);
    if (!email || !email.includes("@")) return send(res, 400, { error: "A valid email is required." });
    try {
      const [u] = await db`SELECT id FROM users WHERE LOWER(email) = ${email}`;
      if (u) {
        const code = makeResetCode();
        await db`UPDATE users SET reset_code = ${code}, reset_expires = ${Date.now() + 15*60*1000}, reset_attempts = 0 WHERE id = ${u.id}`;
        // In production this code is dispatched via email. For sandbox/single-clinic use,
        // also return the code so an admin or local operator can complete the reset.
        return send(res, 200, { ok: true, message: "Reset code generated. Check the account email.", devCode: code, expiresInMinutes: 15 });
      }
      // For privacy do not reveal whether account exists.
      return send(res, 200, { ok: true, message: "If an account exists, a reset code has been sent.", expiresInMinutes: 15 });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  if (method === "POST" && path.endsWith("/api/auth/password/reset")) {
    const email = normalizeEmail(body.email);
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !code || newPassword.length < 8) {
      return send(res, 400, { error: "Email, reset code, and a password of at least 8 characters are required." });
    }
    try {
      const [u] = await db`SELECT * FROM users WHERE LOWER(email) = ${email}`;
      if (!u || !u.reset_code || u.reset_expires < Date.now()) {
        return send(res, 400, { error: "Reset code is invalid or expired." });
      }
      if (u.reset_attempts >= 5) {
        await db`UPDATE users SET reset_code = NULL, reset_expires = 0 WHERE id = ${u.id}`;
        return send(res, 429, { error: "Too many reset attempts." });
      }
      if (u.reset_code !== code) {
        await db`UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ${u.id}`;
        return send(res, 400, { error: "Reset code is invalid." });
      }
      const hash = hashPassword(newPassword);
      await db`UPDATE users SET password_hash = ${hash}, reset_code = NULL, reset_expires = 0, reset_attempts = 0, must_change = false WHERE id = ${u.id}`;
      return send(res, 200, { ok: true, message: "Password updated." });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  if (method === "POST" && path.endsWith("/api/auth/password/admin-reset")) {
    if (!tokenInfo || tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
    const email = normalizeEmail(body.email);
    const newPassword = String(body.newPassword || "") || genTempPassword(12);
    if (!email) return send(res, 400, { error: "email is required." });
    if (newPassword.length < 8) return send(res, 400, { error: "Password must be at least 8 characters." });
    try {
      const [u] = await db`SELECT id FROM users WHERE LOWER(email) = ${email}`;
      if (!u) return send(res, 404, { error: "User not found." });
      const hash = hashPassword(newPassword);
      await db`UPDATE users SET password_hash = ${hash}, must_change = true, reset_code = NULL, reset_expires = 0 WHERE id = ${u.id}`;
      return send(res, 200, { ok: true, email, tempPassword: newPassword });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  if (method === "GET" && path.endsWith("/api/auth/me")) {
    if (!tokenInfo) return send(res, 401, { error: "Not signed in." });
    try {
      const [u] = await db`SELECT * FROM users WHERE id = ${tokenInfo.id}`;
      if (!u || !u.active) return send(res, 401, { error: "Account inactive or missing." });
      return send(res, 200, { user: mapUser(u) });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Users (admin only) ── */
  if (route === "users") {
    if (!tokenInfo || tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM users ORDER BY id`;
        return send(res, 200, { users: rows.map(mapUser) });
      }
      if (method === "DELETE" && id) {
        await db`DELETE FROM users WHERE id = ${parseInt(id)}`;
        return send(res, 200, { ok: true });
      }
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Health ── */
  if (method === "GET" && route === "health") {
    try {
      const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM patients`;
      const [{ count: ucount }] = await db`SELECT COUNT(*)::int AS count FROM users`;
      return send(res, 200, { ok: true, app: "ClinicPulse", runtime: "vercel", patients: count, users: ucount, db: "postgres" });
    } catch (err) {
      return send(res, 200, { ok: true, app: "ClinicPulse", runtime: "vercel", db: "error: " + err.message });
    }
  }

  /* ── Role helpers ── */
  function requireRole(roles) {
    if (!tokenInfo) return send(res, 401, { error: "Not signed in." });
    if (!roles.includes(tokenInfo.role)) return send(res, 403, { error: "Forbidden for role " + tokenInfo.role });
    return null;
  }

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
          INSERT INTO patients (full_name,age,gender,phone,email,address,blood_group,allergies,chronic,vaccinations,branch_id,doctor_id,diagnosis,last_visit_at,created_at,notes,family,visits)
          VALUES (${fullName},${body.age||30},${body.gender||"M"},${body.phone||""},${body.email||""},${body.address||""},${body.bloodGroup||"O+"},
            ${JSON.stringify(body.allergies||[])},${JSON.stringify(body.chronic||[])},${JSON.stringify(body.vaccinations||[])},
            ${body.branchId||1},${body.doctorId||null},${body.diagnosis||"New registration"},
            ${Date.now()},${Date.now()},${body.notes||""},${JSON.stringify(body.family||{})},${JSON.stringify([])})
          RETURNING *
        `;
        const [updated] = await db`UPDATE patients SET mrn=${'CP-'+(2000+p.id)} WHERE id=${p.id} RETURNING *`;
        return send(res, 201, { patient: mapPatient(updated) });
      }
      if (method === "PATCH" && id) {
        const pid = parseInt(id);
        const [existing] = await db`SELECT * FROM patients WHERE id=${pid}`;
        if (!existing) return send(res, 404, { error: "Patient not found" });
        const f = {};
        if (body.fullName    !== undefined) f.full_name    = body.fullName;
        if (body.age         !== undefined) f.age          = body.age;
        if (body.gender      !== undefined) f.gender       = body.gender;
        if (body.phone       !== undefined) f.phone        = body.phone;
        if (body.email       !== undefined) f.email        = body.email;
        if (body.address     !== undefined) f.address      = body.address;
        if (body.bloodGroup  !== undefined) f.blood_group  = body.bloodGroup;
        if (body.allergies   !== undefined) f.allergies    = JSON.stringify(body.allergies);
        if (body.chronic     !== undefined) f.chronic      = JSON.stringify(body.chronic);
        if (body.vaccinations!== undefined) f.vaccinations = JSON.stringify(body.vaccinations);
        if (body.doctorId    !== undefined) f.doctor_id    = body.doctorId;
        if (body.diagnosis   !== undefined) f.diagnosis    = body.diagnosis;
        if (body.lastVisitAt !== undefined) f.last_visit_at= body.lastVisitAt;
        if (body.notes       !== undefined) f.notes        = body.notes;
        if (body.family      !== undefined) f.family       = JSON.stringify(body.family);
        if (body.visits      !== undefined) f.visits       = JSON.stringify(body.visits);
        if (Object.keys(f).length === 0) return send(res, 200, { patient: mapPatient(existing) });
        const [updated] = await db`UPDATE patients SET ${db(f)} WHERE id=${pid} RETURNING *`;
        return send(res, 200, { patient: mapPatient(updated) });
      }
      if (method === "DELETE" && id) {
        // pragmatic protection: only admin can delete
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const pid = parseInt(id);
        await db`DELETE FROM patients WHERE id=${pid}`;
        return send(res, 200, { ok: true, deleted: pid });
      }
      if (method === "DELETE" && !id) {
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean) : [];
        if (ids.length === 0) return send(res, 200, { ok: true, deleted: [] });
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
        const [rx] = await db`SELECT * FROM prescriptions WHERE id=${parseInt(id)}`;
        if (!rx) return send(res, 404, { error: "Prescription not found" });
        return send(res, 200, { prescription: mapPrescription(rx) });
      }
      if (method === "POST") {
        const items = Array.isArray(body.items) ? body.items : [];
        const [rx] = await db`
          INSERT INTO prescriptions (patient_id,doctor_id,created_at,diagnosis,status,items,total)
          VALUES (${body.patientId||null},${body.doctorId||null},${Date.now()},${body.diagnosis||""},${body.status||"active"},${JSON.stringify(items)},${body.total||0})
          RETURNING *
        `;
        // Update tabletsSold + pack stock for each item
        try { await applyTabletsDelta(db, items, +1); }
        catch (err) { console.error("applyTabletsDelta(+1) failed:", err.message); }
        return send(res, 201, { prescription: mapPrescription(rx) });
      }
      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM prescriptions WHERE id=${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Prescription not found" });
        const f = {};
        if (body.diagnosis !== undefined) f.diagnosis = body.diagnosis;
        if (body.status    !== undefined) f.status    = body.status;
        if (body.items     !== undefined) f.items     = JSON.stringify(body.items);
        if (body.total     !== undefined) f.total     = body.total;
        if (body.doctorId  !== undefined) f.doctor_id = body.doctorId;
        if (Object.keys(f).length === 0) return send(res, 200, { prescription: mapPrescription(existing) });
        const [updated] = await db`UPDATE prescriptions SET ${db(f)} WHERE id=${parseInt(id)} RETURNING *`;
        return send(res, 200, { prescription: mapPrescription(updated) });
      }
      if (method === "DELETE" && id) {
        if (tokenInfo && tokenInfo.role !== "admin" && tokenInfo.role !== "doctor") return send(res, 403, { error: "Doctor or admin only." });
        // Reverse tablet sale before deleting
        try {
          const [existingRx] = await db`SELECT items FROM prescriptions WHERE id = ${parseInt(id)}`;
          let parsedItems = existingRx?.items;
          if (typeof parsedItems === "string") {
            try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
          }
          if (Array.isArray(parsedItems)) {
            await applyTabletsDelta(db, parsedItems, -1);
          }
        } catch (err) { console.error("applyTabletsDelta(-1) failed:", err.message); }
        await db`DELETE FROM prescriptions WHERE id = ${parseInt(id)}`;
        return send(res, 200, { ok: true });
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
        // Accept costPerPack/salePricePerPack as friendly aliases for purchase/selling price
        const purchase = body.costPerPack       ?? body.purchasePrice ?? 0;
        const selling  = body.salePricePerPack  ?? body.sellingPrice  ?? 0;
        const tpp      = body.tabletsPerPack    ?? 10;
        const tsold    = body.tabletsSold       ?? 0;
        const [m] = await db`
          INSERT INTO medicines (name,generic,company,unit,purchase_price,selling_price,stock,low_stock_at,batch_no,expiry,barcode,sold_30d,tablets_per_pack,tablets_sold)
          VALUES (${body.name||""},${body.generic||""},${body.company||""},${body.unit||"tab"},${purchase},${selling},${body.stock||0},${body.lowStockAt||25},${body.batchNo||""},${body.expiry||0},${body.barcode||""},${body.sold30d||0},${tpp},${tsold})
          RETURNING *
        `;
        return send(res, 201, { medicine: mapMedicine(m) });
      }
      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM medicines WHERE id=${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Medicine not found" });
        const f = {};
        if (body.name             !== undefined) f.name = body.name;
        if (body.generic          !== undefined) f.generic = body.generic;
        if (body.company          !== undefined) f.company = body.company;
        if (body.unit             !== undefined) f.unit = body.unit;
        if (body.purchasePrice    !== undefined) f.purchase_price = body.purchasePrice;
        if (body.costPerPack      !== undefined) f.purchase_price = body.costPerPack;
        if (body.sellingPrice     !== undefined) f.selling_price  = body.sellingPrice;
        if (body.salePricePerPack !== undefined) f.selling_price  = body.salePricePerPack;
        if (body.stock            !== undefined) f.stock = body.stock;
        if (body.lowStockAt       !== undefined) f.low_stock_at = body.lowStockAt;
        if (body.batchNo          !== undefined) f.batch_no = body.batchNo;
        if (body.expiry           !== undefined) f.expiry = body.expiry;
        if (body.barcode          !== undefined) f.barcode = body.barcode;
        if (body.sold30d          !== undefined) f.sold_30d = body.sold30d;
        if (body.tabletsPerPack   !== undefined) f.tablets_per_pack = Math.max(1, parseInt(body.tabletsPerPack) || 1);
        if (body.tabletsSold      !== undefined) f.tablets_sold     = Math.max(0, parseInt(body.tabletsSold) || 0);
        if (Object.keys(f).length === 0) return send(res, 200, { medicine: mapMedicine(existing) });
        const [updated] = await db`UPDATE medicines SET ${db(f)} WHERE id=${parseInt(id)} RETURNING *`;
        return send(res, 200, { medicine: mapMedicine(updated) });
      }
      if (method === "DELETE" && id) {
        if (tokenInfo && tokenInfo.role !== "admin" && tokenInfo.role !== "pharmacist") return send(res, 403, { error: "Admin/pharmacist only." });
        await db`DELETE FROM medicines WHERE id=${parseInt(id)}`;
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
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const fullName = String(body.fullName || "").trim();
        const email = normalizeEmail(body.email);
        const initials = body.initials ||
          fullName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
        const phone = String(body.phone || "");
        const specialty = String(body.specialty || "General Practice");

        const [d] = await db`
          INSERT INTO doctors (email,full_name,specialty,branch_id,initials,active,phone)
          VALUES (${email},${fullName},${specialty},${body.branchId||1},${initials},${body.active!==false},${phone})
          RETURNING *
        `;

        // Auto-create linked user with a temporary password (or one supplied by admin)
        let tempPassword = null;
        let userCreated = null;
        if (email) {
          const [exists] = await db`SELECT id FROM users WHERE LOWER(email) = ${email}`;
          if (!exists) {
            tempPassword = String(body.password || "").length >= 8 ? String(body.password) : genTempPassword(12);
            const hash = hashPassword(tempPassword);
            const [u] = await db`
              INSERT INTO users (email, password_hash, role, full_name, initials, branch_id, specialty, active, doctor_id, must_change)
              VALUES (${email}, ${hash}, 'doctor', ${fullName}, ${initials}, ${body.branchId||1}, ${specialty}, true, ${d.id}, ${!body.password})
              RETURNING *
            `;
            userCreated = mapUser(u);
          } else {
            // link existing user to doctor row
            await db`UPDATE users SET doctor_id = ${d.id}, full_name = ${fullName}, initials = ${initials}, specialty = ${specialty} WHERE id = ${exists.id}`;
          }
        }

        return send(res, 201, { doctor: mapDoctor(d), user: userCreated, tempPassword });
      }
      if (method === "PATCH" && id) {
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const [existing] = await db`SELECT * FROM doctors WHERE id=${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Doctor not found" });
        const f = {};
        if (body.email     !== undefined) f.email     = body.email;
        if (body.fullName  !== undefined) f.full_name = body.fullName;
        if (body.specialty !== undefined) f.specialty = body.specialty;
        if (body.initials  !== undefined) f.initials  = body.initials;
        if (body.active    !== undefined) f.active    = body.active;
        if (body.phone     !== undefined) f.phone     = body.phone;
        if (Object.keys(f).length === 0) return send(res, 200, { doctor: mapDoctor(existing) });
        const [updated] = await db`UPDATE doctors SET ${db(f)} WHERE id=${parseInt(id)} RETURNING *`;
        // Cascade name/spec changes to the linked user record (if any)
        if (body.fullName !== undefined || body.specialty !== undefined || body.initials !== undefined) {
          await db`UPDATE users SET full_name = ${updated.full_name}, initials = ${updated.initials}, specialty = ${updated.specialty} WHERE doctor_id = ${updated.id}`;
        }
        return send(res, 200, { doctor: mapDoctor(updated) });
      }
      if (method === "DELETE" && id) {
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const did = parseInt(id);
        // delete linked user too (avoid orphaned credentials)
        await db`DELETE FROM users WHERE doctor_id = ${did}`;
        await db`DELETE FROM doctors WHERE id=${did}`;
        return send(res, 200, { ok: true, deleted: did });
      }
    } catch (err) {
      console.error("doctors error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Appointments ── */
  if (route === "appointments") {
    try {
      if (method === "GET" && !id) {
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        let rows;
        if (from && to) {
          rows = await db`SELECT * FROM appointments WHERE scheduled_at BETWEEN ${parseInt(from)} AND ${parseInt(to)} ORDER BY scheduled_at`;
        } else {
          rows = await db`SELECT * FROM appointments ORDER BY scheduled_at`;
        }
        return send(res, 200, { appointments: rows.map(mapAppointment) });
      }
      if (method === "GET" && id) {
        const [a] = await db`SELECT * FROM appointments WHERE id = ${parseInt(id)}`;
        if (!a) return send(res, 404, { error: "Appointment not found" });
        return send(res, 200, { appointment: mapAppointment(a) });
      }
      if (method === "POST") {
        const [a] = await db`
          INSERT INTO appointments (patient_id, doctor_id, branch_id, scheduled_at, status, token, reason, channel, notes)
          VALUES (${body.patientId||null}, ${body.doctorId||null}, ${body.branchId||1}, ${body.scheduledAt||Date.now()},
                  ${body.status||"scheduled"}, ${body.token||1}, ${body.reason||"Consultation"},
                  ${body.channel||"walk_in"}, ${body.notes||""})
          RETURNING *
        `;
        return send(res, 201, { appointment: mapAppointment(a) });
      }
      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM appointments WHERE id = ${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Appointment not found" });
        const f = {};
        if (body.patientId   !== undefined) f.patient_id = body.patientId;
        if (body.doctorId    !== undefined) f.doctor_id = body.doctorId;
        if (body.scheduledAt !== undefined) f.scheduled_at = body.scheduledAt;
        if (body.status      !== undefined) f.status = body.status;
        if (body.token       !== undefined) f.token = body.token;
        if (body.reason      !== undefined) f.reason = body.reason;
        if (body.channel     !== undefined) f.channel = body.channel;
        if (body.notes       !== undefined) f.notes = body.notes;
        if (Object.keys(f).length === 0) return send(res, 200, { appointment: mapAppointment(existing) });
        const [updated] = await db`UPDATE appointments SET ${db(f)} WHERE id = ${parseInt(id)} RETURNING *`;
        return send(res, 200, { appointment: mapAppointment(updated) });
      }
      if (method === "DELETE" && id) {
        await db`DELETE FROM appointments WHERE id = ${parseInt(id)}`;
        return send(res, 200, { ok: true });
      }
    } catch (err) {
      console.error("appointments error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Payments ── */
  if (route === "payments") {
    try {
      if (method === "GET" && !id) {
        const rows = await db`SELECT * FROM payments ORDER BY created_at DESC`;
        return send(res, 200, { payments: rows.map(mapPayment) });
      }
      if (method === "POST") {
        const [p] = await db`
          INSERT INTO payments (patient_id, prescription_id, amount, method, status, invoice_no, created_at)
          VALUES (${body.patientId||null}, ${body.prescriptionId||null}, ${body.amount||0},
                  ${body.method||"Cash"}, ${body.status||"paid"}, ${body.invoiceNo || ""}, ${Date.now()})
          RETURNING *
        `;
        // Auto-generate invoice number if not provided
        if (!body.invoiceNo) {
          const inv = `INV-${10000 + p.id}`;
          await db`UPDATE payments SET invoice_no = ${inv} WHERE id = ${p.id}`;
          p.invoice_no = inv;
        }
        return send(res, 201, { payment: mapPayment(p) });
      }
      if (method === "PATCH" && id) {
        const [existing] = await db`SELECT * FROM payments WHERE id = ${parseInt(id)}`;
        if (!existing) return send(res, 404, { error: "Payment not found" });
        const f = {};
        if (body.amount    !== undefined) f.amount = body.amount;
        if (body.method    !== undefined) f.method = body.method;
        if (body.status    !== undefined) f.status = body.status;
        if (body.invoiceNo !== undefined) f.invoice_no = body.invoiceNo;
        if (Object.keys(f).length === 0) return send(res, 200, { payment: mapPayment(existing) });
        const [updated] = await db`UPDATE payments SET ${db(f)} WHERE id = ${parseInt(id)} RETURNING *`;
        return send(res, 200, { payment: mapPayment(updated) });
      }
      if (method === "DELETE" && id) {
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        await db`DELETE FROM payments WHERE id = ${parseInt(id)}`;
        return send(res, 200, { ok: true });
      }
    } catch (err) {
      console.error("payments error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  /* ── Settings ── */
  if (route === "settings") {
    try {
      if (method === "GET") {
        const [row] = await db`SELECT * FROM settings WHERE id=1`;
        if (!row) {
          await db`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
          const [r2] = await db`SELECT * FROM settings WHERE id=1`;
          return send(res, 200, { settings: mapSettings(r2) });
        }
        return send(res, 200, { settings: mapSettings(row) });
      }
      if (method === "PATCH") {
        if (tokenInfo && tokenInfo.role !== "admin") return send(res, 403, { error: "Admin only." });
        const f = {};
        if (body.clinicName  !== undefined) f.clinic_name  = body.clinicName;
        if (body.clinicSlug  !== undefined) f.clinic_slug  = body.clinicSlug;
        if (body.currency    !== undefined) f.currency     = body.currency;
        if (body.timezone    !== undefined) f.timezone     = body.timezone;
        if (body.notifEmail  !== undefined) f.notif_email  = body.notifEmail;
        if (body.notifSms    !== undefined) f.notif_sms    = body.notifSms;
        if (body.notifWa     !== undefined) f.notif_wa     = body.notifWa;
        if (body.notifPush   !== undefined) f.notif_push   = body.notifPush;
        f.updated_at = Date.now();
        await db`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
        await db`UPDATE settings SET ${db(f)} WHERE id = 1`;
        const [final] = await db`SELECT * FROM settings WHERE id = 1`;
        return send(res, 200, { settings: mapSettings(final) });
      }
    } catch (err) {
      console.error("settings error:", err);
      return send(res, 500, { error: err.message });
    }
  }

  return send(res, 404, { error: "API route not found", path, method });
}
