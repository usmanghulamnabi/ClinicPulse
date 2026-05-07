import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ======================================================================
 * ClinicPulse — Drizzle (SQLite) schema for the deployed preview backend.
 * NOTE: The production-grade Prisma schema (Postgres-ready) lives in
 *   prisma/schema.prisma at the project root and mirrors these models.
 * ====================================================================== */

/* ---------- Tenancy ---------- */
export const clinics = sqliteTable("clinics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("pro"),
  createdAt: integer("created_at").notNull(),
});

export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
});

/* ---------- Auth & RBAC ---------- */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id"),
  branchId: integer("branch_id"),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // bcrypt hash in production
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // admin | doctor | receptionist | pharmacist | patient
  specialty: text("specialty"),
  avatarUrl: text("avatar_url"),
  twoFactorEnabled: integer("two_factor_enabled").notNull().default(0),
  active: integer("active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

export const sessionsTable = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  device: text("device"),
  ip: text("ip"),
  location: text("location"),
  lastActiveAt: integer("last_active_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  meta: text("meta"),
  createdAt: integer("created_at").notNull(),
});

/* ---------- Patients ---------- */
export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  branchId: integer("branch_id"),
  mrn: text("mrn").notNull().unique(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"), // JSON array
  chronic: text("chronic"),     // JSON array
  family: text("family"),       // JSON
  vaccinations: text("vaccinations"), // JSON array
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const visits = sqliteTable("visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  branchId: integer("branch_id").notNull(),
  visitedAt: integer("visited_at").notNull(),
  diagnosis: text("diagnosis"),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  plan: text("plan"),
});

/* ---------- Medicines / Inventory ---------- */
export const medicines = sqliteTable("medicines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  generic: text("generic"),
  company: text("company"),
  unit: text("unit").notNull().default("tab"),
  barcode: text("barcode"),
  purchasePrice: real("purchase_price").notNull().default(0),
  sellingPrice: real("selling_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  lowStockAt: integer("low_stock_at").notNull().default(20),
  batchNo: text("batch_no"),
  expiry: integer("expiry"),
});

export const inventoryLogs = sqliteTable("inventory_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicineId: integer("medicine_id").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(), // purchase | sale | expiry | adjustment
  ref: text("ref"),
  createdAt: integer("created_at").notNull(),
});

/* ---------- Prescriptions ---------- */
export const prescriptions = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  visitId: integer("visit_id"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull(),
});

export const prescriptionItems = sqliteTable("prescription_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prescriptionId: integer("prescription_id").notNull(),
  medicineId: integer("medicine_id").notNull(),
  dose: text("dose").notNull(),       // e.g. "500mg"
  frequency: text("frequency").notNull(), // "1-0-1"
  duration: integer("duration").notNull(), // days
  qty: integer("qty").notNull(),
  notes: text("notes"),
});

/* ---------- Appointments ---------- */
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  branchId: integer("branch_id").notNull(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  scheduledAt: integer("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | checked_in | in_progress | done | cancelled
  token: integer("token"),
  reason: text("reason"),
  channel: text("channel").notNull().default("walk_in"), // walk_in | online | phone
});

/* ---------- Billing & Finance ---------- */
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  patientId: integer("patient_id").notNull(),
  prescriptionId: integer("prescription_id"),
  amount: real("amount").notNull(),
  method: text("method").notNull(), // cash | card | jazzcash | easypaisa | bank
  status: text("status").notNull().default("paid"), // paid | due | refunded
  invoiceNo: text("invoice_no").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  branchId: integer("branch_id"),
  category: text("category").notNull(), // rent | salary | utilities | supplies | misc
  amount: real("amount").notNull(),
  note: text("note"),
  spentAt: integer("spent_at").notNull(),
});

export const profitLogs = sqliteTable("profit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicId: integer("clinic_id").notNull(),
  date: integer("date").notNull(),
  revenue: real("revenue").notNull(),
  cogs: real("cogs").notNull(),
  expenses: real("expenses").notNull(),
  profit: real("profit").notNull(),
});

/* ---------- Notifications ---------- */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // low_stock | expiry | appointment | due | new_patient | summary
  title: text("title").notNull(),
  body: text("body"),
  read: integer("read").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

/* ---------- Insert schemas / Types ---------- */
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true, mrn: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

export type Medicine = typeof medicines.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SessionRow = typeof sessionsTable.$inferSelect;
