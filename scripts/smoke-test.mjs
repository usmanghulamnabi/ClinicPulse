/**
 * ClinicPulse API Smoke Tests
 *
 * Tests the Vercel serverless handler directly (no HTTP server needed).
 * Imports api/index.js and calls the exported handler with mock req/res objects.
 *
 * Routes tested:
 *   POST /api/auth/login          — valid + invalid credentials
 *   POST /api/auth/password/request
 *   GET  /api/health
 *   GET  /api/patients
 *   POST /api/patients
 *   GET  /api/patients/:id
 *   PATCH /api/patients/:id
 *   DELETE /api/patients/:id
 *   GET  /api/prescriptions
 *   POST /api/prescriptions
 *   GET  /api/prescriptions/:id
 *   GET  /api/medicines
 *   POST /api/medicines
 *   DELETE /api/medicines/:id
 *   GET  /api/doctors
 *   POST /api/doctors
 *   DELETE /api/doctors/:id
 *   GET  /api/settings
 *   PATCH /api/settings
 *   GET  /api/unknown-route       → 404
 *
 * When POSTGRES_URL is not set, DB-dependent routes return 503 gracefully.
 * Auth routes always pass regardless.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// ── Dynamic import of handler ──────────────────────────────────────────────
let handler;
try {
  const mod = await import(join(projectRoot, "api/index.js"));
  handler = mod.default;
} catch (e) {
  console.error("❌  Cannot import api/index.js:", e.message);
  process.exit(1);
}

// ── Mock req/res helpers ───────────────────────────────────────────────────

function mockReq(method, path, body = {}) {
  return {
    method,
    url: `https://clinicpulse.local/api/index?path=${path.replace(/^\/api\//, "")}`,
    body,
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

async function call(method, path, body) {
  const req = mockReq(method, path, body);
  const res = mockRes();
  await handler(req, res);
  return { status: res.statusCode, body: res.body };
}

// ── Test runner ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
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
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 52 - title.length))}`);
}

const dbAvailable = !!process.env.POSTGRES_URL;
console.log(`\nClinicPulse Smoke Tests`);
console.log(`Database: ${dbAvailable ? "✓ POSTGRES_URL set" : "✗ POSTGRES_URL not set — DB routes expect 503"}`);

// ── Auth routes (always work) ──────────────────────────────────────────────
section("Auth — login");
{
  const ok = await call("POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "demo1234" });
  assert("Valid login returns 200", ok.status === 200);
  assert("Returns token", typeof ok.body?.token === "string");
  assert("Returns user object", ok.body?.user?.email === "admin@clinicpulse.app");
  assert("Returns admin role", ok.body?.user?.role === "admin");

  const fail = await call("POST", "/api/auth/login", { email: "admin@clinicpulse.app", password: "wrongpass" });
  assert("Invalid credentials returns 401", fail.status === 401);
  assert("Returns error message", typeof fail.body?.error === "string");

  const doc = await call("POST", "/api/auth/login", { email: "doctor@clinicpulse.app", password: "demo1234" });
  assert("Doctor login returns 200", doc.status === 200);
  assert("Doctor role is doctor", doc.body?.user?.role === "doctor");

  const recep = await call("POST", "/api/auth/login", { email: "front@clinicpulse.app", password: "demo1234" });
  assert("Receptionist login returns 200", recep.status === 200);

  const pharm = await call("POST", "/api/auth/login", { email: "pharm@clinicpulse.app", password: "demo1234" });
  assert("Pharmacist login returns 200", pharm.status === 200);
}

section("Auth — password reset request");
{
  const r = await call("POST", "/api/auth/password/request", { email: "admin@clinicpulse.app" });
  assert("Password request returns 200", r.status === 200);
  assert("Returns ok:true", r.body?.ok === true);

  const bad = await call("POST", "/api/auth/password/request", { email: "notanemail" });
  assert("Invalid email returns 400", bad.status === 400);
}

section("Auth — me");
{
  const r = await call("GET", "/api/auth/me", {});
  assert("GET /api/auth/me returns 200", r.status === 200);
}

section("Auth — signup");
{
  const r = await call("POST", "/api/auth/signup", { email: "newuser@test.com", fullName: "Test User", role: "doctor" });
  assert("Signup returns 200", r.status === 200);
  assert("Returns ok", r.body?.ok === true);

  const bad = await call("POST", "/api/auth/signup", { email: "" });
  assert("Signup without email returns 400", bad.status === 400);
}

section("OPTIONS preflight");
{
  const r = await call("OPTIONS", "/api/patients", {});
  assert("OPTIONS returns 204", r.status === 204);
}

// ── DB-dependent routes ────────────────────────────────────────────────────
if (!dbAvailable) {
  section("DB routes (no POSTGRES_URL — graceful degradation)");
  for (const [method, path, body] of [
    ["GET", "/api/health", {}],
    ["GET", "/api/patients", {}],
    ["POST", "/api/patients", { fullName: "Test Patient" }],
    ["GET", "/api/prescriptions", {}],
    ["GET", "/api/medicines", {}],
    ["GET", "/api/doctors", {}],
    ["GET", "/api/settings", {}],
  ]) {
    const r = await call(method, path, body);
    assert(`${method} ${path} returns 503 (no DB)`, r.status === 503, `got ${r.status}`);
    assert(`${method} ${path} has error message`, typeof r.body?.error === "string");
  }
} else {
  section("Health check");
  {
    const r = await call("GET", "/api/health", {});
    assert("GET /api/health returns 200", r.status === 200);
    assert("Health reports postgres db", r.body?.db === "postgres");
  }

  section("Patients CRUD");
  let patientId;
  {
    const list = await call("GET", "/api/patients", {});
    assert("GET /api/patients returns 200", list.status === 200);
    assert("Returns patients array", Array.isArray(list.body?.patients));

    const create = await call("POST", "/api/patients", {
      fullName: "Smoke Test Patient",
      age: 35, gender: "M", phone: "+92 300 9999999",
      email: "smoke@test.com", address: "Test Address",
      bloodGroup: "O+", allergies: ["Penicillin"], chronic: [],
      vaccinations: [], branchId: 1, doctorId: null,
      diagnosis: "Smoke test registration", notes: "",
    });
    assert("POST /api/patients returns 201", create.status === 201);
    assert("Returns patient with id", typeof create.body?.patient?.id === "number");
    assert("MRN is auto-generated", create.body?.patient?.mrn?.startsWith("CP-"));
    patientId = create.body?.patient?.id;

    if (patientId) {
      const get = await call("GET", `/api/patients/${patientId}`, {});
      assert("GET /api/patients/:id returns 200", get.status === 200);
      assert("Returns correct patient", get.body?.patient?.id === patientId);

      const patch = await call("PATCH", `/api/patients/${patientId}`, { diagnosis: "Updated diagnosis" });
      assert("PATCH /api/patients/:id returns 200", patch.status === 200);
      assert("Diagnosis updated", patch.body?.patient?.diagnosis === "Updated diagnosis");
    }
  }

  section("Prescriptions CRUD");
  let prescriptionId;
  {
    const list = await call("GET", "/api/prescriptions", {});
    assert("GET /api/prescriptions returns 200", list.status === 200);
    assert("Returns prescriptions array", Array.isArray(list.body?.prescriptions));

    if (patientId) {
      const create = await call("POST", "/api/prescriptions", {
        patientId,
        doctorId: null,
        diagnosis: "Smoke test diagnosis",
        status: "active",
        items: [{ medicineId: 1, dose: "500mg", frequency: "1-0-1", duration: 5, qty: 10 }],
        total: 140,
      });
      assert("POST /api/prescriptions returns 201", create.status === 201);
      assert("Returns prescription with id", typeof create.body?.prescription?.id === "number");
      prescriptionId = create.body?.prescription?.id;

      if (prescriptionId) {
        const get = await call("GET", `/api/prescriptions/${prescriptionId}`, {});
        assert("GET /api/prescriptions/:id returns 200", get.status === 200);

        const patch = await call("PATCH", `/api/prescriptions/${prescriptionId}`, { status: "completed" });
        assert("PATCH /api/prescriptions/:id returns 200", patch.status === 200);
        assert("Status updated", patch.body?.prescription?.status === "completed");
      }
    }
  }

  section("Medicines CRUD");
  let medicineId;
  {
    const list = await call("GET", "/api/medicines", {});
    assert("GET /api/medicines returns 200", list.status === 200);
    assert("Returns medicines array", Array.isArray(list.body?.medicines));

    const create = await call("POST", "/api/medicines", {
      name: "Smoke Test Tab", generic: "smoke-generic", company: "TestCo",
      unit: "tab", purchasePrice: 5, sellingPrice: 10, stock: 100,
      lowStockAt: 20, batchNo: "BSMOKE01", expiry: Date.now() + 365*86400000,
      barcode: "849000099999", sold30d: 0,
    });
    assert("POST /api/medicines returns 201", create.status === 201);
    assert("Returns medicine with id", typeof create.body?.medicine?.id === "number");
    medicineId = create.body?.medicine?.id;

    if (medicineId) {
      const del = await call("DELETE", `/api/medicines/${medicineId}`, {});
      assert("DELETE /api/medicines/:id returns 200", del.status === 200);
    }
  }

  section("Doctors CRUD");
  let doctorId;
  {
    const list = await call("GET", "/api/doctors", {});
    assert("GET /api/doctors returns 200", list.status === 200);
    assert("Returns doctors array", Array.isArray(list.body?.doctors));

    const create = await call("POST", "/api/doctors", {
      fullName: "Dr. Smoke Test", email: "smoke@doctor.test",
      specialty: "General Practice", branchId: 1, phone: "+92 300 0000000",
      active: true,
    });
    assert("POST /api/doctors returns 201", create.status === 201);
    assert("Returns doctor with id", typeof create.body?.doctor?.id === "number");
    assert("Initials auto-generated", typeof create.body?.doctor?.initials === "string");
    doctorId = create.body?.doctor?.id;

    if (doctorId) {
      const patch = await call("PATCH", `/api/doctors/${doctorId}`, { specialty: "Cardiology" });
      assert("PATCH /api/doctors/:id returns 200", patch.status === 200);
      assert("Specialty updated", patch.body?.doctor?.specialty === "Cardiology");

      const del = await call("DELETE", `/api/doctors/${doctorId}`, {});
      assert("DELETE /api/doctors/:id returns 200", del.status === 200);
      assert("Returns deleted id", del.body?.deleted === doctorId);
    }
  }

  section("Settings CRUD");
  {
    const get = await call("GET", "/api/settings", {});
    assert("GET /api/settings returns 200", get.status === 200);
    assert("Returns settings object", typeof get.body?.settings === "object");
    assert("Has clinicName", typeof get.body?.settings?.clinicName === "string");
    assert("Has timezone", typeof get.body?.settings?.timezone === "string");
    assert("Has notifEmail boolean", typeof get.body?.settings?.notifEmail === "boolean");

    const patch = await call("PATCH", "/api/settings", {
      clinicName: "Smoke Test Clinic",
      timezone: "Asia/Karachi",
      notifEmail: true,
      notifSms: false,
      notifWa: true,
      notifPush: false,
    });
    assert("PATCH /api/settings returns 200", patch.status === 200);
    assert("Clinic name updated", patch.body?.settings?.clinicName === "Smoke Test Clinic");
    assert("notifPush updated to false", patch.body?.settings?.notifPush === false);
    assert("updatedAt is a number", typeof patch.body?.settings?.updatedAt === "number");

    // Restore original clinic name
    await call("PATCH", "/api/settings", { clinicName: "ClinicPulse Health" });

    // 404 test
    const notFound = await call("GET", "/api/nonexistent-route", {});
    assert("Unknown route returns 404", notFound.status === 404);
  }

  section("Patient cleanup");
  {
    if (patientId) {
      // Delete the smoke test patient (cascades prescription)
      const del = await call("DELETE", `/api/patients/${patientId}`, {});
      assert("DELETE smoke test patient returns 200", del.status === 200);
    }
  }

  section("Bulk patient delete");
  {
    // Create 2 patients then bulk delete
    const p1 = await call("POST", "/api/patients", { fullName: "Bulk Del 1", age: 30, gender: "M", phone: "+1", email: "b1@t.com", address: "A", bloodGroup: "O+", allergies: [], chronic: [], vaccinations: [], branchId: 1, diagnosis: "test" });
    const p2 = await call("POST", "/api/patients", { fullName: "Bulk Del 2", age: 31, gender: "F", phone: "+2", email: "b2@t.com", address: "B", bloodGroup: "A+", allergies: [], chronic: [], vaccinations: [], branchId: 1, diagnosis: "test" });
    const ids = [p1.body?.patient?.id, p2.body?.patient?.id].filter(Boolean);
    if (ids.length === 2) {
      const bulk = await call("DELETE", "/api/patients", { ids });
      assert("Bulk DELETE /api/patients returns 200", bulk.status === 200);
      assert("Bulk delete confirms ids", Array.isArray(bulk.body?.deleted) && bulk.body.deleted.length === 2);
    } else {
      assert("Bulk delete setup skipped (no ids)", false, "Could not create test patients");
    }
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(56)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.error(`\nFailed tests:\n${errors.map(e => `  • ${e}`).join("\n")}`);
  process.exit(1);
} else {
  console.log(`\n✅  All smoke tests passed!`);
}
