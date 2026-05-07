/**
 * demo-data.ts — re-exports from seed-data for backward compatibility.
 * Direct mutations should use the AppStore (useStore hook) instead.
 */
export {
  CLINIC, BRANCHES, USERS, AUDIT_LOG, ACTIVE_SESSIONS, NOTIFICATIONS, RX_TEMPLATES,
  SEED_PATIENTS as PATIENTS, SEED_MEDICINES as MEDICINES, SEED_PRESCRIPTIONS as PRESCRIPTIONS,
  SEED_DOCTORS as DOCTORS,
  APPOINTMENTS, PAYMENTS, EXPENSES,
  monthlySeries, last30Days, peakHours, diseaseTrends, topMedicines, doctorPerformance,
  fmtMoney, fmtRelative, dailyKPIs,
  type Patient, type Medicine, type Prescription, type Doctor, type Role, type Gender,
  type Appointment, type Payment,
} from "./seed-data";
