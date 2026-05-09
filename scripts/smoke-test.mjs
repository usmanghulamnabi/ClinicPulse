/**
 * ClinicPulse API Smoke Tests
 *
 * Tests the Vercel serverless handler directly (no HTTP server needed).
 * Imports api/index.js and calls the exported handler with mock req/res objects.
 *
 * Coverage:
 *   • Auth: login (admin/doctor/receptionist/pharmacist), bad creds, /me with token
 *   • Auth: signup persistence, password request → reset (DB-backed)
 *   • Auth: admin password reset endpoint
 *   • Health
 *   • Patients CRUD + bulk delete
 *   • Prescriptions CRUD
 *   • Medicines CRUD
 *   • Doctors CRUD (creates linked user with temp password)
 *   • Appointments CRUD
 *   • Payments CRUD
 *   • Settings GET/PATCH
 *   • Unknown route 404
 *
 * When POSTGRES_URL is not set, every route returns 503 (graceful degradation).
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

let handler;
let testables;
try {
  const mod = await import(join(projectRoot, "api/index.js"));
  handler = mod.default;
  testables = mod.__testables;
} catch (e) {
  console.error("❌  Cannot import api/index.js:", e.message);
  process.exit(1);
}

/* ── Mock req/res helpers ────────────────────────────────────────────────── */

function mockReq(method, path, body = {}, headers = {}) {
  return {
    method,
    url: `https://clinicpulse.local/api/index?path=${path.replace(/^\/api\//, "")}`,
    body,
    headers,
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    end(data) { this.body = data ? JSON.parse(data) : null; },
  };
  return res;
}

async function call(method, path, body = {}, headers = {}) {
  const req = mockReq(method, path, body, headers);
  const res = mockRes();
  await handler(req, res);
  return { status: res.statusCode, body: res.body };
}

/* ── Test runner ─────────────────────────────────────────────────────────── */

let passed = 0, failed = 0;
const errors = [];

function assert(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✓  ${name}`);
    passed++;
  } else {
    console.error(`  ✗  ${name}${detail ? " — " + detail : ""}`);
    failed++;
    errors.push(name);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 56 - title.length))}`);
}

/* ── Pure tablet-calculator unit tests (always run, no DB needed) ──────── */
section("Tablet calculator (pure functions, no DB)");
if (testables) {
  const { calcDosesPerDay, calcTabletsPerDose, calcDurationDays, calcTabletsForItem } = testables;
  // Frequency parsing
  assert("BD = 2/day", calcDosesPerDay("BD") === 2);
  assert("BID = 2/day", calcDosesPerDay("BID") === 2);
  assert("OD = 1/day", calcDosesPerDay("OD") === 1);
  assert("TDS = 3/day", calcDosesPerDay("TDS") === 3);
  assert("TID = 3/day", calcDosesPerDay("TID") === 3);
  assert("QID = 4/day", calcDosesPerDay("QID") === 4);
  assert("HS = 1/day", calcDosesPerDay("HS") === 1);
  assert("PRN = 0", calcDosesPerDay("PRN") === 0);
  assert("SOS = 0", calcDosesPerDay("SOS") === 0);
  assert("Q8H = 3/day", calcDosesPerDay("Q8H") === 3);
  assert("1-0-1 = 2/day", calcDosesPerDay("1-0-1") === 2);
  assert("1-1-1 = 3/day", calcDosesPerDay("1-1-1") === 3);

  // Dose parsing
  assert("'1 tablet' = 1", calcTabletsPerDose("1 tablet", "tab") === 1);
  assert("'2 tablets' = 2", calcTabletsPerDose("2 tablets", "tab") === 2);
  assert("'1/2 tablet' = 0.5", calcTabletsPerDose("1/2 tablet", "tab") === 0.5);
  assert("'0.5 tab' = 0.5", calcTabletsPerDose("0.5 tab", "tab") === 0.5);
  assert("'5 ml' → 0 (not tablet)", calcTabletsPerDose("5 ml", "ml") === 0);
  assert("'500mg' on tablet unit defaults to 1", calcTabletsPerDose("500mg", "tab") === 1);
  assert("'500mg' on syrup unit → 0", calcTabletsPerDose("500mg", "ml") === 0);

  // Duration parsing
  assert("5 (number) = 5 days", calcDurationDays({ duration: 5 }) === 5);
  assert("'5 days' = 5", calcDurationDays({ duration: "5 days" }) === 5);
  assert("'1 week' = 7", calcDurationDays({ duration: "1 week" }) === 7);
  assert("'2 wks' = 14", calcDurationDays({ duration: "2 wks" }) === 14);
  assert("'1 month' = 30", calcDurationDays({ duration: "1 month" }) === 30);

  // End-to-end: 1 tablet BD for 5 days = 10 tablets
  assert(
    "1 tablet BD x 5d = 10",
    calcTabletsForItem({ dose: "1 tablet", frequency: "BD", duration: 5 }, "tab") === 10
  );
  // 1 tablet TDS x 7 days = 21
  assert(
    "1 tablet TDS x 7d = 21",
    calcTabletsForItem({ dose: "1 tablet", frequency: "TDS", duration: 7 }, "tab") === 21
  );
  // 1/2 tablet BD x 10 days = 10
  assert(
    "1/2 tablet BD x 10d = 10",
    calcTabletsForItem({ dose: "1/2 tablet", frequency: "BD", duration: 10 }, "tab") === 10
  );
  // 1-0-1 numeric format (no dose text) on tablet unit = 2/day x 5 = 10
  assert(
    "'500mg' 1-0-1 5d = 10",
    calcTabletsForItem({ dose: "500mg", frequency: "1-0-1", duration: 5 }, "tab") === 10
  );
  // Inhaler/non-tablet should be 0
  assert(
    "100mcg PRN 30d on inhaler = 0",
    calcTabletsForItem({ dose: "100mcg", frequency: "PRN", duration: 30 }, "unit") === 0
  );
} else {
  assert("__testables exported from api/index.js", false, "export missing");
}

const dbAvailable = !!process.env.POSTGRES_URL;
console.log(`\nClinicPulse Smoke Tests`);
console.log(`Database: ${dbAvailable ? "✓ POSTGRES_URL set — exercising full DB suite"
                                       : "✗ POSTGRES_URL not set — verifying 503 graceful failure"}`);

/* ── No-DB graceful path ─────────────────────────────────────────────────── */
if (!dbAvailable) {
  section("No-DB graceful 503");
  for (const [method, path, body] of [
    ["POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "demo1234" }],
    ["GET",  "/api/health", {}],
    ["GET",  "/api/patients", {}],
    ["POST", "/api/patients", { fullName: "Test" }],
    ["GET",  "/api/prescriptions", {}],
    ["GET",  "/api/medicines", {}],
    ["GET",  "/api/doctors", {}],
    ["GET",  "/api/appointments", {}],
    ["GET",  "/api/payments", {}],
    ["GET",  "/api/settings", {}],
  ]) {
    const r = await call(method, path, body);
    assert(`${method} ${path} returns 503`, r.status === 503, `got ${r.status}`);
    assert(`${method} ${path} has error message`, typeof r.body?.error === "string");
  }

  // Even OPTIONS preflight should work without DB
  section("OPTIONS preflight (no DB)");
  {
    const r = await call("OPTIONS", "/api/patients", {});
    assert("OPTIONS returns 204", r.status === 204);
  }
} else {
  /* ── DB-backed full suite ──────────────────────────────────────────────── */

  // Capture an admin token for routes that require it
  let adminToken = null;
  let doctorToken = null;

  section("Auth — login (DB-backed)");
  {
    const ok = await call("POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "demo1234" });
    assert("Valid admin login returns 200", ok.status === 200, `got ${ok.status} — ${JSON.stringify(ok.body).slice(0, 200)}`);
    assert("Returns token (string)", typeof ok.body?.token === "string");
    assert("Returns user.email", ok.body?.user?.email === "admin@clinicpulse.app");
    assert("Returns admin role", ok.body?.user?.role === "admin");
    adminToken = ok.body?.token;

    const fail = await call("POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "wrongpass" });
    assert("Invalid credentials returns 401", fail.status === 401);

    const doc = await call("POST", "/api/auth/login", { email: "doctor@clinicpulse.app", password: "demo1234" });
    assert("Doctor login returns 200", doc.status === 200);
    assert("Doctor role is doctor", doc.body?.user?.role === "doctor");
    doctorToken = doc.body?.token;

    const recep = await call("POST", "/api/auth/login", { email: "front@clinicpulse.app", password: "demo1234" });
    assert("Receptionist login returns 200", recep.status === 200);

    const pharm = await call("POST", "/api/auth/login", { email: "pharm@clinicpulse.app", password: "demo1234" });
    assert("Pharmacist login returns 200", pharm.status === 200);
  }

  section("Auth — /me with token");
  {
    const me = await call("GET", "/api/auth/me", {}, { authorization: `Bearer ${adminToken}` });
    assert("GET /api/auth/me with admin token returns 200", me.status === 200);
    assert("Resolves admin email", me.body?.user?.email === "admin@clinicpulse.app");

    const noAuth = await call("GET", "/api/auth/me", {});
    assert("GET /api/auth/me without token returns 401", noAuth.status === 401);
  }

  section("Auth — signup (creates patient user)");
  let signupEmail = `smoke-${Date.now()}@test.com`;
  {
    const r = await call("POST", "/api/auth/signup", { email: signupEmail, fullName: "Smoke Patient", password: "smokepass123" });
    assert("Signup returns 201", r.status === 201);
    assert("Returns user.email", r.body?.user?.email === signupEmail);
    assert("Role is patient", r.body?.user?.role === "patient");

    // Now sign in with the new account
    const login = await call("POST", "/api/auth/login", { email: signupEmail, password: "smokepass123" });
    assert("New patient can log in", login.status === 200);

    const dup = await call("POST", "/api/auth/signup", { email: signupEmail, fullName: "Dup", password: "another123" });
    assert("Duplicate email signup returns 409", dup.status === 409);

    const bad = await call("POST", "/api/auth/signup", { email: "x", fullName: "y", password: "short" });
    assert("Short password returns 400", bad.status === 400);
  }

  section("Auth — DB-backed password reset");
  {
    const req = await call("POST", "/api/auth/password/request", { email: signupEmail });
    assert("Reset request returns 200", req.status === 200);
    assert("Reset code returned (single-clinic devCode)", typeof req.body?.devCode === "string");

    const reset = await call("POST", "/api/auth/password/reset", {
      email: signupEmail, code: req.body.devCode, newPassword: "freshpass123",
    });
    assert("Reset completes", reset.status === 200, `got ${reset.status}: ${JSON.stringify(reset.body)}`);

    const oldFails = await call("POST", "/api/auth/login", { email: signupEmail, password: "smokepass123" });
    assert("Old password no longer works", oldFails.status === 401);

    const newWorks = await call("POST", "/api/auth/login", { email: signupEmail, password: "freshpass123" });
    assert("New password works", newWorks.status === 200);
  }

  section("Auth — admin password reset");
  {
    const r = await call("POST", "/api/auth/password/admin-reset",
      { email: signupEmail },
      { authorization: `Bearer ${adminToken}` }
    );
    assert("Admin reset returns 200", r.status === 200);
    assert("Returns tempPassword", typeof r.body?.tempPassword === "string" && r.body.tempPassword.length >= 8);

    const newPwLogin = await call("POST", "/api/auth/login", { email: signupEmail, password: r.body.tempPassword });
    assert("Login with admin-set password works", newPwLogin.status === 200);

    // Non-admin cannot reset
    const forbidden = await call("POST", "/api/auth/password/admin-reset",
      { email: signupEmail },
      { authorization: `Bearer ${doctorToken}` }
    );
    assert("Non-admin reset returns 403", forbidden.status === 403);
  }

  section("Health");
  {
    const r = await call("GET", "/api/health", {});
    assert("Health returns 200", r.status === 200);
    assert("Health reports postgres", r.body?.db === "postgres");
    assert("Health reports user count > 0", typeof r.body?.users === "number" && r.body.users > 0);
  }

  section("Patients CRUD");
  let patientId;
  {
    const list = await call("GET", "/api/patients", {});
    assert("List returns 200", list.status === 200);
    assert("Patients array", Array.isArray(list.body?.patients));

    const create = await call("POST", "/api/patients", {
      fullName: "Smoke Test Patient", age: 35, gender: "M",
      phone: "+92 300 9999999", email: "smoke@test.com", address: "Test",
      bloodGroup: "O+", allergies: ["Penicillin"], chronic: [], vaccinations: [],
      branchId: 1, doctorId: null, diagnosis: "Smoke test", notes: "",
    });
    assert("Create returns 201", create.status === 201);
    assert("Auto MRN generated", create.body?.patient?.mrn?.startsWith("CP-"));
    patientId = create.body?.patient?.id;

    if (patientId) {
      const get = await call("GET", `/api/patients/${patientId}`, {});
      assert("Get by id returns 200", get.status === 200);
      const patch = await call("PATCH", `/api/patients/${patientId}`, { diagnosis: "Updated" });
      assert("Patch returns 200", patch.status === 200);
      assert("Diagnosis updated", patch.body?.patient?.diagnosis === "Updated");
    }
  }

  section("Prescriptions CRUD");
  let prescriptionId;
  if (patientId) {
    const list = await call("GET", "/api/prescriptions", {});
    assert("List returns 200", list.status === 200);

    const create = await call("POST", "/api/prescriptions", {
      patientId, doctorId: null, diagnosis: "Smoke",
      status: "active", items: [{ medicineId: 1, dose: "500mg", frequency: "1-0-1", duration: 5, qty: 10 }],
      total: 140,
    });
    assert("Create returns 201", create.status === 201);
    prescriptionId = create.body?.prescription?.id;

    const patch = await call("PATCH", `/api/prescriptions/${prescriptionId}`, { status: "completed" });
    assert("Patch returns 200", patch.status === 200);
    assert("Status updated", patch.body?.prescription?.status === "completed");
  }

  section("Medicines CRUD + tablets-per-pack economics");
  {
    const list = await call("GET", "/api/medicines", {});
    assert("List returns 200", list.status === 200);
    // First medicine should expose new tablet fields after schema migration
    const sample = list.body?.medicines?.[0];
    assert("GET medicine includes tabletsPerPack", typeof sample?.tabletsPerPack === "number");
    assert("GET medicine includes tabletsSold", typeof sample?.tabletsSold === "number");
    assert("GET medicine includes profit", typeof sample?.profit === "number");
    assert("GET medicine includes revenue", typeof sample?.revenue === "number");

    const create = await call("POST", "/api/medicines", {
      name: "Smoke Med", generic: "smoke", company: "TestCo", unit: "tab",
      costPerPack: 50, salePricePerPack: 100, stock: 100, lowStockAt: 20,
      tabletsPerPack: 10,
      batchNo: "BSMOKE", expiry: Date.now() + 365*86400000,
      barcode: "849000099999", sold30d: 0,
    });
    assert("Create returns 201", create.status === 201);
    assert("Create echoes tabletsPerPack", create.body?.medicine?.tabletsPerPack === 10);
    assert("Create echoes salePricePerPack", Number(create.body?.medicine?.salePricePerPack) === 100);
    const mid = create.body?.medicine?.id;

    if (mid) {
      // PATCH legacy field name
      const patch1 = await call("PATCH", `/api/medicines/${mid}`, { stock: 99 });
      assert("PATCH stock returns 200", patch1.status === 200);
      assert("Stock updated", patch1.body?.medicine?.stock === 99);

      // PATCH new tablet/pack fields and price
      const patch2 = await call("PATCH", `/api/medicines/${mid}`, {
        tabletsPerPack: 20,
        costPerPack: 80,
        salePricePerPack: 200,
      });
      assert("PATCH tabletsPerPack returns 200", patch2.status === 200);
      assert("tabletsPerPack updated to 20", patch2.body?.medicine?.tabletsPerPack === 20);
      assert("costPerPack updated", Number(patch2.body?.medicine?.costPerPack) === 80);
      assert("salePricePerPack updated", Number(patch2.body?.medicine?.salePricePerPack) === 200);
      assert("pricePerTablet derived = 10", Number(patch2.body?.medicine?.pricePerTablet) === 10);

      const del = await call("DELETE", `/api/medicines/${mid}`, {}, { authorization: `Bearer ${adminToken}` });
      assert("Delete returns 200", del.status === 200);
    }
  }

  section("Prescription tablets sold + profit calculation");
  if (patientId) {
    // Create a fresh medicine with predictable economics so we can assert exactly
    const medCreate = await call("POST", "/api/medicines", {
      name: "Tablet Calc Med", generic: "calc", company: "TestCo", unit: "tab",
      costPerPack: 50, salePricePerPack: 150, stock: 50, lowStockAt: 5,
      tabletsPerPack: 10, sold30d: 0,
      batchNo: "BCALC", expiry: Date.now() + 365*86400000,
      barcode: `849${Date.now().toString().slice(-9)}`,
    });
    assert("Create calc medicine returns 201", medCreate.status === 201);
    const calcMedId = medCreate.body?.medicine?.id;
    const medBefore = medCreate.body?.medicine;
    assert("Initial tabletsSold is 0", medBefore?.tabletsSold === 0);
    assert("Initial profit is 0", Number(medBefore?.profit) === 0);

    // Create a prescription: 1 tablet BD for 5 days → 10 tablets
    const rx = await call("POST", "/api/prescriptions", {
      patientId,
      doctorId: 2,
      diagnosis: "Smoke tablet calc",
      status: "active",
      items: [{ medicineId: calcMedId, dose: "1 tablet", frequency: "BD", duration: 5, qty: 10 }],
      total: 150,
    });
    assert("Create Rx returns 201", rx.status === 201);
    const rxId = rx.body?.prescription?.id;

    const medAfter = await call("GET", "/api/medicines", {});
    const m1 = medAfter.body?.medicines?.find(x => x.id === calcMedId);
    assert("After Rx: tabletsSold = 10", m1?.tabletsSold === 10, `got ${m1?.tabletsSold}`);
    // Expected profit = 10 * (150-50)/10 = 100
    assert("After Rx: profit = 100", Math.round(Number(m1?.profit)) === 100, `got ${m1?.profit}`);
    // Expected revenue = 10 * (150/10) = 150
    assert("After Rx: revenue = 150", Math.round(Number(m1?.revenue)) === 150, `got ${m1?.revenue}`);
    // Stock should still be 49 (10 tablets used, 1 pack of 10 fully consumed)
    assert("After Rx: stock decremented by 1 pack", m1?.stock === 49, `got ${m1?.stock}`);

    // Multi-line: 1 tablet TDS for 7 days = 21 tablets on a second medicine
    const med2 = await call("POST", "/api/medicines", {
      name: "Calc Med 2", generic: "calc2", company: "TestCo", unit: "tab",
      costPerPack: 100, salePricePerPack: 200, stock: 30, lowStockAt: 5,
      tabletsPerPack: 10, sold30d: 0,
      batchNo: "BCALC2", expiry: Date.now() + 365*86400000,
      barcode: `849${(Date.now()+1).toString().slice(-9)}`,
    });
    const calcMed2Id = med2.body?.medicine?.id;
    const rx2 = await call("POST", "/api/prescriptions", {
      patientId,
      doctorId: 2,
      diagnosis: "Multi-line",
      status: "active",
      items: [
        { medicineId: calcMedId, dose: "1 tablet", frequency: "OD", duration: 7, qty: 7 },
        { medicineId: calcMed2Id, dose: "1 tablet", frequency: "TDS", duration: 7, qty: 21 },
      ],
      total: 0,
    });
    assert("Create multi-line Rx returns 201", rx2.status === 201);
    const rx2Id = rx2.body?.prescription?.id;

    const after2 = await call("GET", "/api/medicines", {});
    const m1b = after2.body?.medicines?.find(x => x.id === calcMedId);
    const m2b = after2.body?.medicines?.find(x => x.id === calcMed2Id);
    assert("Med1 tabletsSold cumulative = 17", m1b?.tabletsSold === 17, `got ${m1b?.tabletsSold}`);
    assert("Med2 tabletsSold = 21", m2b?.tabletsSold === 21, `got ${m2b?.tabletsSold}`);
    // Med2 profit = 21 * (200-100)/10 = 210
    assert("Med2 profit = 210", Math.round(Number(m2b?.profit)) === 210, `got ${m2b?.profit}`);

    // Reverse on delete: deleting rx2 should subtract 7 from med1 and 21 from med2
    if (rx2Id) {
      const del = await call("DELETE", `/api/prescriptions/${rx2Id}`, {}, { authorization: `Bearer ${adminToken}` });
      assert("Delete Rx returns 200", del.status === 200);
      const after3 = await call("GET", "/api/medicines", {});
      const m1c = after3.body?.medicines?.find(x => x.id === calcMedId);
      const m2c = after3.body?.medicines?.find(x => x.id === calcMed2Id);
      assert("Med1 tabletsSold after delete = 10", m1c?.tabletsSold === 10, `got ${m1c?.tabletsSold}`);
      assert("Med2 tabletsSold after delete = 0", m2c?.tabletsSold === 0, `got ${m2c?.tabletsSold}`);
    }

    // Cleanup
    if (rxId) await call("DELETE", `/api/prescriptions/${rxId}`, {}, { authorization: `Bearer ${adminToken}` });
    if (calcMedId) await call("DELETE", `/api/medicines/${calcMedId}`, {}, { authorization: `Bearer ${adminToken}` });
    if (calcMed2Id) await call("DELETE", `/api/medicines/${calcMed2Id}`, {}, { authorization: `Bearer ${adminToken}` });
  }

  section("Doctors CRUD with linked user account");
  let doctorId;
  let createdEmail;
  {
    const list = await call("GET", "/api/doctors", {});
    assert("List returns 200", list.status === 200);

    createdEmail = `smoke-doc-${Date.now()}@test.com`;
    const create = await call("POST", "/api/doctors", {
      fullName: "Dr. Smoke Test", email: createdEmail,
      specialty: "General Practice", branchId: 1, phone: "+92 300 0000000",
      active: true,
    }, { authorization: `Bearer ${adminToken}` });
    assert("Create doctor returns 201", create.status === 201, `got ${create.status}: ${JSON.stringify(create.body)}`);
    assert("Initials auto-generated", typeof create.body?.doctor?.initials === "string");
    assert("Temp password returned", typeof create.body?.tempPassword === "string" && create.body.tempPassword.length >= 8);
    assert("Linked user returned", create.body?.user?.email === createdEmail);
    doctorId = create.body?.doctor?.id;

    // Doctor can sign in with the temp password
    const login = await call("POST", "/api/auth/login", { email: createdEmail, password: create.body.tempPassword });
    assert("New doctor can log in", login.status === 200);
    assert("New doctor role is doctor", login.body?.user?.role === "doctor");

    // Non-admin cannot create doctor
    const forbidden = await call("POST", "/api/doctors", { fullName: "x", email: "x@y.z" }, { authorization: `Bearer ${doctorToken}` });
    assert("Non-admin POST /doctors returns 403", forbidden.status === 403);

    if (doctorId) {
      const patch = await call("PATCH", `/api/doctors/${doctorId}`, { specialty: "Cardiology" }, { authorization: `Bearer ${adminToken}` });
      assert("Patch returns 200", patch.status === 200);

      const del = await call("DELETE", `/api/doctors/${doctorId}`, {}, { authorization: `Bearer ${adminToken}` });
      assert("Delete returns 200", del.status === 200);

      // After delete, the linked user is gone too
      const orphan = await call("POST", "/api/auth/login", { email: createdEmail, password: create.body.tempPassword });
      assert("Linked user removed (login fails)", orphan.status === 401);
    }
  }

  section("Appointments CRUD");
  if (patientId) {
    const list = await call("GET", "/api/appointments", {});
    assert("List returns 200", list.status === 200);
    assert("Appointments array", Array.isArray(list.body?.appointments));

    const create = await call("POST", "/api/appointments", {
      patientId, doctorId: null, branchId: 1,
      scheduledAt: Date.now() + 3600_000, status: "scheduled",
      token: 99, reason: "Smoke check-up", channel: "walk_in",
    });
    assert("Create returns 201", create.status === 201);
    const aId = create.body?.appointment?.id;

    if (aId) {
      const patch = await call("PATCH", `/api/appointments/${aId}`, { status: "checked_in" });
      assert("Patch returns 200", patch.status === 200);
      assert("Status updated", patch.body?.appointment?.status === "checked_in");

      const del = await call("DELETE", `/api/appointments/${aId}`, {});
      assert("Delete returns 200", del.status === 200);
    }
  }

  section("Payments CRUD");
  if (patientId) {
    const list = await call("GET", "/api/payments", {});
    assert("List returns 200", list.status === 200);

    const create = await call("POST", "/api/payments", {
      patientId, prescriptionId: prescriptionId ?? null,
      amount: 250, method: "Cash", status: "paid",
    });
    assert("Create returns 201", create.status === 201);
    assert("Auto invoice number", create.body?.payment?.invoiceNo?.startsWith("INV-"));
    const pid = create.body?.payment?.id;

    if (pid) {
      const patch = await call("PATCH", `/api/payments/${pid}`, { status: "due" });
      assert("Patch returns 200", patch.status === 200);
      assert("Status updated to due", patch.body?.payment?.status === "due");

      const del = await call("DELETE", `/api/payments/${pid}`, {}, { authorization: `Bearer ${adminToken}` });
      assert("Delete returns 200", del.status === 200);
    }
  }

  section("Settings");
  {
    const get = await call("GET", "/api/settings", {});
    assert("GET returns 200", get.status === 200);
    assert("Has clinicName", typeof get.body?.settings?.clinicName === "string");

    const patch = await call("PATCH", "/api/settings",
      { clinicName: "Smoke Clinic", notifSms: true },
      { authorization: `Bearer ${adminToken}` }
    );
    assert("PATCH (admin) returns 200", patch.status === 200);
    assert("clinicName persisted", patch.body?.settings?.clinicName === "Smoke Clinic");
    assert("notifSms persisted", patch.body?.settings?.notifSms === true);

    // Restore
    await call("PATCH", "/api/settings",
      { clinicName: "ClinicPulse Health", notifSms: false },
      { authorization: `Bearer ${adminToken}` }
    );

    // Non-admin cannot patch
    const forbidden = await call("PATCH", "/api/settings",
      { clinicName: "Hacker" },
      { authorization: `Bearer ${doctorToken}` }
    );
    assert("Non-admin PATCH settings returns 403", forbidden.status === 403);
  }

  section("Cleanup + bulk delete + 404");
  {
    if (patientId) {
      const del = await call("DELETE", `/api/patients/${patientId}`, {}, { authorization: `Bearer ${adminToken}` });
      assert("Cleanup smoke patient returns 200", del.status === 200);
    }

    // Non-admin cannot delete patients
    if (patientId) {
      const f = await call("DELETE", `/api/patients/999999`, {}, { authorization: `Bearer ${doctorToken}` });
      assert("Non-admin patient delete returns 403", f.status === 403);
    }

    // Bulk delete
    const p1 = await call("POST", "/api/patients", { fullName: "Bulk 1", age: 30, gender: "M", phone: "+1", email: "b1@t.com", address: "A", bloodGroup: "O+", allergies: [], chronic: [], vaccinations: [], branchId: 1, diagnosis: "test" });
    const p2 = await call("POST", "/api/patients", { fullName: "Bulk 2", age: 31, gender: "F", phone: "+2", email: "b2@t.com", address: "B", bloodGroup: "A+", allergies: [], chronic: [], vaccinations: [], branchId: 1, diagnosis: "test" });
    const ids = [p1.body?.patient?.id, p2.body?.patient?.id].filter(Boolean);
    if (ids.length === 2) {
      const bulk = await call("DELETE", "/api/patients", { ids }, { authorization: `Bearer ${adminToken}` });
      assert("Bulk delete returns 200", bulk.status === 200);
      assert("Bulk delete confirms ids", Array.isArray(bulk.body?.deleted) && bulk.body.deleted.length === 2);
    }

    // 404 unknown route
    const notFound = await call("GET", "/api/nonexistent-route", {});
    assert("Unknown route returns 404", notFound.status === 404);
  }

  // Final cleanup of the smoke signup user
  {
    const adminLogin = await call("POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "demo1234" });
    if (adminLogin.body?.token) {
      // We don't have a delete user endpoint other than via doctors;
      // just leave the smoke patient signup in place, it's a 'patient' role and harmless.
    }
  }
}

/* ── Summary ────────────────────────────────────────────────────────────── */
console.log(`\n${"═".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.error(`\nFailed tests:\n${errors.map(e => `  • ${e}`).join("\n")}`);
  process.exit(1);
} else {
  console.log(`\n✅  All smoke tests passed!`);
}
