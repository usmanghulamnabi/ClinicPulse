/**
 * ClinicPulse App Store
 *
 * React Context that loads patients, prescriptions, medicines, doctors,
 * appointments, payments, and settings from Postgres-backed API on mount.
 * All mutations call the API first; local state is updated on success.
 *
 * Persistence: Postgres via POSTGRES_URL (Vercel env var).
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  SEED_PATIENTS,
  SEED_PRESCRIPTIONS,
  SEED_MEDICINES,
  SEED_DOCTORS,
  type Patient,
  type Prescription,
  type Medicine,
  type Doctor,
} from "./seed-data";
import { apiRequest } from "./queryClient";

/* ── Re-export types ─────────────────────────────────────────────────────── */
export type { Patient, Prescription, Medicine, Doctor };

/* ── Appointment & Payment types ─────────────────────────────────────────── */
export interface Appointment {
  id: number;
  patientId: number | null;
  doctorId: number | null;
  branchId: number;
  scheduledAt: number;
  status: "scheduled" | "checked_in" | "in_progress" | "done" | "cancelled";
  token: number;
  reason: string;
  channel: "online" | "walk_in" | "phone";
  notes?: string;
}

export interface Payment {
  id: number;
  patientId: number | null;
  prescriptionId: number | null;
  amount: number;
  method: string;
  status: "paid" | "due" | "refunded";
  invoiceNo: string;
  createdAt: number;
}

/* ── Settings type ───────────────────────────────────────────────────────── */
export interface ClinicSettings {
  clinicName:  string;
  clinicSlug:  string;
  currency:    string;
  timezone:    string;
  notifEmail:  boolean;
  notifSms:    boolean;
  notifWa:     boolean;
  notifPush:   boolean;
  updatedAt?:  number;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName:  "ClinicPulse Health",
  clinicSlug:  "clinicpulse-health",
  currency:    "PKR (₨)",
  timezone:    "Asia/Karachi",
  notifEmail:  true,
  notifSms:    false,
  notifWa:     true,
  notifPush:   true,
};

/* ── API helpers (all use apiRequest with Authorization header) ──────────── */

async function apiGet<T>(url: string): Promise<T> {
  const res = await apiRequest("GET", url);
  return res.json() as Promise<T>;
}

async function apiSend<T>(method: string, url: string, data?: unknown): Promise<T> {
  const res = await apiRequest(method, url, data);
  return res.json() as Promise<T>;
}

/* ── Context type ────────────────────────────────────────────────────────── */

interface AppStore {
  loading: boolean;
  error: string | null;
  ready: boolean;

  /* patients */
  patients: Patient[];
  addPatient: (p: Omit<Patient, "id" | "mrn" | "createdAt" | "lastVisitAt" | "visits">) => Promise<Patient>;
  updatePatient: (id: number, patch: Partial<Patient>) => Promise<void>;
  deletePatient: (id: number) => Promise<void>;
  deletePatientsMany: (ids: number[]) => Promise<void>;

  /* prescriptions */
  prescriptions: Prescription[];
  addPrescription: (rx: Omit<Prescription, "id" | "createdAt">) => Promise<Prescription>;
  updatePrescription: (id: number, patch: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: number) => Promise<void>;

  /* medicines */
  medicines: Medicine[];
  addMedicine: (m: Omit<Medicine, "id">) => Promise<Medicine>;
  updateMedicine: (id: number, patch: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: number) => Promise<void>;

  /* doctors */
  doctors: Doctor[];
  addDoctor: (d: Omit<Doctor, "id"> & { password?: string }) =>
    Promise<{ doctor: Doctor; tempPassword: string | null }>;
  updateDoctor: (id: number, patch: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: number) => Promise<void>;

  /* appointments */
  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id">) => Promise<Appointment>;
  updateAppointment: (id: number, patch: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: number) => Promise<void>;

  /* payments */
  payments: Payment[];
  addPayment: (p: Omit<Payment, "id" | "createdAt" | "invoiceNo"> & { invoiceNo?: string }) => Promise<Payment>;
  updatePayment: (id: number, patch: Partial<Payment>) => Promise<void>;
  deletePayment: (id: number) => Promise<void>;

  /* settings */
  settings: ClinicSettings;
  updateSettings: (patch: Partial<ClinicSettings>) => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────────────────────── */

const Ctx = createContext<AppStore>({} as AppStore);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(SEED_PRESCRIPTIONS);
  const [medicines, setMedicines] = useState<Medicine[]>(SEED_MEDICINES);
  const [doctors, setDoctors] = useState<Doctor[]>(SEED_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);

  /* ── Bootstrap: fetch all resources on mount ── */
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [pRes, rxRes, medRes, drRes, apRes, payRes, stRes] = await Promise.all([
          apiGet<{ patients?: Patient[] }>("/api/patients"),
          apiGet<{ prescriptions?: Prescription[] }>("/api/prescriptions"),
          apiGet<{ medicines?: Medicine[] }>("/api/medicines"),
          apiGet<{ doctors?: Doctor[] }>("/api/doctors"),
          apiGet<{ appointments?: Appointment[] }>("/api/appointments"),
          apiGet<{ payments?: Payment[] }>("/api/payments"),
          apiGet<{ settings?: ClinicSettings }>("/api/settings"),
        ]);

        if (cancelled) return;

        if (Array.isArray(pRes?.patients))         setPatients(pRes.patients);
        if (Array.isArray(rxRes?.prescriptions))   setPrescriptions(rxRes.prescriptions);
        if (Array.isArray(medRes?.medicines))      setMedicines(medRes.medicines);
        if (Array.isArray(drRes?.doctors))         setDoctors(drRes.doctors);
        if (Array.isArray(apRes?.appointments))    setAppointments(apRes.appointments);
        if (Array.isArray(payRes?.payments))       setPayments(payRes.payments);
        if (stRes?.settings)                       setSettings(stRes.settings);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes("503") ||
            msg.includes("Database unavailable") ||
            msg.includes("POSTGRES_URL")
          ) {
            console.warn("ClinicPulse: DB unavailable, using seed data:", msg);
          } else {
            console.error("ClinicPulse: Failed to load data:", msg);
            setError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  /* ── Patients ── */

  const addPatient = useCallback(
    async (p: Omit<Patient, "id" | "mrn" | "createdAt" | "lastVisitAt" | "visits">) => {
      const data = await apiSend<{ patient: Patient }>("POST", "/api/patients", p);
      setPatients(cur => [data.patient, ...cur]);
      return data.patient;
    },
    [],
  );

  const updatePatient = useCallback(async (id: number, patch: Partial<Patient>) => {
    const data = await apiSend<{ patient: Patient }>("PATCH", `/api/patients/${id}`, patch);
    setPatients(cur => cur.map(p => p.id === id ? data.patient : p));
  }, []);

  const deletePatient = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/patients/${id}`);
    setPatients(cur => cur.filter(p => p.id !== id));
    setPrescriptions(cur => cur.filter(rx => rx.patientId !== id));
    setAppointments(cur => cur.filter(a => a.patientId !== id));
    setPayments(cur => cur.filter(pay => pay.patientId !== id));
  }, []);

  const deletePatientsMany = useCallback(async (ids: number[]) => {
    await apiSend<unknown>("DELETE", "/api/patients", { ids });
    const set = new Set(ids);
    setPatients(cur => cur.filter(p => !set.has(p.id)));
    setPrescriptions(cur => cur.filter(rx => !set.has(rx.patientId)));
    setAppointments(cur => cur.filter(a => a.patientId !== null && !set.has(a.patientId)));
    setPayments(cur => cur.filter(pay => pay.patientId !== null && !set.has(pay.patientId)));
  }, []);

  /* ── Prescriptions ── */

  const addPrescription = useCallback(
    async (rx: Omit<Prescription, "id" | "createdAt">) => {
      const data = await apiSend<{ prescription: Prescription }>("POST", "/api/prescriptions", rx);
      setPrescriptions(cur => [data.prescription, ...cur]);
      return data.prescription;
    },
    [],
  );

  const updatePrescription = useCallback(async (id: number, patch: Partial<Prescription>) => {
    const data = await apiSend<{ prescription: Prescription }>("PATCH", `/api/prescriptions/${id}`, patch);
    setPrescriptions(cur => cur.map(r => r.id === id ? data.prescription : r));
  }, []);

  const deletePrescription = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/prescriptions/${id}`);
    setPrescriptions(cur => cur.filter(rx => rx.id !== id));
  }, []);

  /* ── Medicines ── */

  const addMedicine = useCallback(async (m: Omit<Medicine, "id">) => {
    const data = await apiSend<{ medicine: Medicine }>("POST", "/api/medicines", m);
    setMedicines(cur => [...cur, data.medicine]);
    return data.medicine;
  }, []);

  const updateMedicine = useCallback(async (id: number, patch: Partial<Medicine>) => {
    const data = await apiSend<{ medicine: Medicine }>("PATCH", `/api/medicines/${id}`, patch);
    setMedicines(cur => cur.map(m => m.id === id ? data.medicine : m));
  }, []);

  const deleteMedicine = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/medicines/${id}`);
    setMedicines(cur => cur.filter(m => m.id !== id));
  }, []);

  /* ── Doctors ── */

  const addDoctor = useCallback(async (d: Omit<Doctor, "id"> & { password?: string }) => {
    const data = await apiSend<{ doctor: Doctor; tempPassword: string | null }>("POST", "/api/doctors", d);
    setDoctors(cur => [...cur, data.doctor]);
    return { doctor: data.doctor, tempPassword: data.tempPassword };
  }, []);

  const updateDoctor = useCallback(async (id: number, patch: Partial<Doctor>) => {
    const data = await apiSend<{ doctor: Doctor }>("PATCH", `/api/doctors/${id}`, patch);
    setDoctors(cur => cur.map(d => d.id === id ? data.doctor : d));
  }, []);

  const deleteDoctor = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/doctors/${id}`);
    setDoctors(cur => cur.filter(d => d.id !== id));
    setPatients(cur => cur.map(p => p.doctorId === id ? { ...p, doctorId: null as unknown as number } : p));
    setPrescriptions(cur => cur.map(rx => rx.doctorId === id ? { ...rx, doctorId: null as unknown as number } : rx));
    setAppointments(cur => cur.map(a => a.doctorId === id ? { ...a, doctorId: null } : a));
  }, []);

  /* ── Appointments ── */

  const addAppointment = useCallback(async (a: Omit<Appointment, "id">) => {
    const data = await apiSend<{ appointment: Appointment }>("POST", "/api/appointments", a);
    setAppointments(cur => [...cur, data.appointment].sort((x, y) => x.scheduledAt - y.scheduledAt));
    return data.appointment;
  }, []);

  const updateAppointment = useCallback(async (id: number, patch: Partial<Appointment>) => {
    const data = await apiSend<{ appointment: Appointment }>("PATCH", `/api/appointments/${id}`, patch);
    setAppointments(cur => cur.map(a => a.id === id ? data.appointment : a));
  }, []);

  const deleteAppointment = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/appointments/${id}`);
    setAppointments(cur => cur.filter(a => a.id !== id));
  }, []);

  /* ── Payments ── */

  const addPayment = useCallback(async (p: Omit<Payment, "id" | "createdAt" | "invoiceNo"> & { invoiceNo?: string }) => {
    const data = await apiSend<{ payment: Payment }>("POST", "/api/payments", p);
    setPayments(cur => [data.payment, ...cur]);
    return data.payment;
  }, []);

  const updatePayment = useCallback(async (id: number, patch: Partial<Payment>) => {
    const data = await apiSend<{ payment: Payment }>("PATCH", `/api/payments/${id}`, patch);
    setPayments(cur => cur.map(p => p.id === id ? data.payment : p));
  }, []);

  const deletePayment = useCallback(async (id: number) => {
    await apiSend<unknown>("DELETE", `/api/payments/${id}`);
    setPayments(cur => cur.filter(p => p.id !== id));
  }, []);

  /* ── Settings ── */

  const updateSettings = useCallback(async (patch: Partial<ClinicSettings>) => {
    const data = await apiSend<{ settings: ClinicSettings }>("PATCH", "/api/settings", patch);
    setSettings(data.settings);
  }, []);

  /* ── Provider ── */
  return (
    <Ctx.Provider
      value={{
        loading, error, ready,
        patients, addPatient, updatePatient, deletePatient, deletePatientsMany,
        prescriptions, addPrescription, updatePrescription, deletePrescription,
        medicines, addMedicine, updateMedicine, deleteMedicine,
        doctors, addDoctor, updateDoctor, deleteDoctor,
        appointments, addAppointment, updateAppointment, deleteAppointment,
        payments, addPayment, updatePayment, deletePayment,
        settings, updateSettings,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
