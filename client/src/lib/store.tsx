/**
 * ClinicPulse App Store
 *
 * React Context that:
 * - On mount: fetches patients, prescriptions, medicines, doctors, settings from API in parallel.
 * - All mutations: call the API first, update local state on success.
 * - Falls back to seed data silently when DB is unavailable (e.g. POSTGRES_URL not set).
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

/* ── Re-export types ─────────────────────────────────────────────────────── */
export type { Patient, Prescription, Medicine, Doctor };

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

/* ── API helpers ─────────────────────────────────────────────────────────── */

async function apiFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

async function apiMutate(
  method: string,
  url: string,
  data?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : {},
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

/* ── Context type ────────────────────────────────────────────────────────── */

interface AppStore {
  loading: boolean;
  error: string | null;

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

  /* medicines */
  medicines: Medicine[];
  addMedicine: (m: Omit<Medicine, "id">) => Promise<Medicine>;
  updateMedicine: (id: number, patch: Partial<Medicine>) => void;
  deleteMedicine: (id: number) => Promise<void>;

  /* doctors */
  doctors: Doctor[];
  addDoctor: (d: Omit<Doctor, "id">) => Promise<Doctor>;
  updateDoctor: (id: number, patch: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: number) => Promise<void>;

  /* settings */
  settings: ClinicSettings;
  updateSettings: (patch: Partial<ClinicSettings>) => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────────────────────── */

const Ctx = createContext<AppStore>({} as AppStore);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(SEED_PRESCRIPTIONS);
  const [medicines, setMedicines] = useState<Medicine[]>(SEED_MEDICINES);
  const [doctors, setDoctors] = useState<Doctor[]>(SEED_DOCTORS);
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);

  /* ── Bootstrap: fetch all resources on mount ── */
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [pRes, rxRes, medRes, drRes, stRes] = await Promise.all([
          apiFetch("/api/patients"),
          apiFetch("/api/prescriptions"),
          apiFetch("/api/medicines"),
          apiFetch("/api/doctors"),
          apiFetch("/api/settings"),
        ]);

        if (cancelled) return;

        const pData  = pRes  as { patients?:      Patient[]      };
        const rxData = rxRes as { prescriptions?: Prescription[] };
        const mData  = medRes as { medicines?:     Medicine[]     };
        const dData  = drRes as { doctors?:        Doctor[]       };
        const sData  = stRes as { settings?:       ClinicSettings };

        if (Array.isArray(pData?.patients))       setPatients(pData.patients);
        if (Array.isArray(rxData?.prescriptions)) setPrescriptions(rxData.prescriptions);
        if (Array.isArray(mData?.medicines))      setMedicines(mData.medicines);
        if (Array.isArray(dData?.doctors))        setDoctors(dData.doctors);
        if (sData?.settings)                      setSettings(sData.settings);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes("503") ||
            msg.includes("Database unavailable") ||
            msg.includes("POSTGRES_URL")
          ) {
            // DB not configured — fall back to seed data silently
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
      const data = await apiMutate("POST", "/api/patients", p) as { patient: Patient };
      const patient = data.patient;
      setPatients(cur => [patient, ...cur]);
      return patient;
    },
    [],
  );

  const updatePatient = useCallback(async (id: number, patch: Partial<Patient>) => {
    const data = await apiMutate("PATCH", `/api/patients/${id}`, patch) as { patient: Patient };
    setPatients(cur => cur.map(p => p.id === id ? data.patient : p));
  }, []);

  const deletePatient = useCallback(async (id: number) => {
    await apiMutate("DELETE", `/api/patients/${id}`);
    setPatients(cur => cur.filter(p => p.id !== id));
    setPrescriptions(cur => cur.filter(rx => rx.patientId !== id));
  }, []);

  const deletePatientsMany = useCallback(async (ids: number[]) => {
    await apiMutate("DELETE", "/api/patients", { ids });
    const set = new Set(ids);
    setPatients(cur => cur.filter(p => !set.has(p.id)));
    setPrescriptions(cur => cur.filter(rx => !set.has(rx.patientId)));
  }, []);

  /* ── Prescriptions ── */

  const addPrescription = useCallback(
    async (rx: Omit<Prescription, "id" | "createdAt">) => {
      const data = await apiMutate("POST", "/api/prescriptions", rx) as { prescription: Prescription };
      const prescription = data.prescription;
      setPrescriptions(cur => [prescription, ...cur]);
      return prescription;
    },
    [],
  );

  const updatePrescription = useCallback(async (id: number, patch: Partial<Prescription>) => {
    const data = await apiMutate("PATCH", `/api/prescriptions/${id}`, patch) as { prescription: Prescription };
    setPrescriptions(cur => cur.map(r => r.id === id ? data.prescription : r));
  }, []);

  /* ── Medicines ── */

  const addMedicine = useCallback(async (m: Omit<Medicine, "id">) => {
    const data = await apiMutate("POST", "/api/medicines", m) as { medicine: Medicine };
    const medicine = data.medicine;
    setMedicines(cur => [...cur, medicine]);
    return medicine;
  }, []);

  // updateMedicine: local-only (stock adjustments, no PATCH endpoint needed)
  const updateMedicine = useCallback((id: number, patch: Partial<Medicine>) => {
    setMedicines(cur => cur.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const deleteMedicine = useCallback(async (id: number) => {
    await apiMutate("DELETE", `/api/medicines/${id}`);
    setMedicines(cur => cur.filter(m => m.id !== id));
  }, []);

  /* ── Doctors ── */

  const addDoctor = useCallback(async (d: Omit<Doctor, "id">) => {
    const data = await apiMutate("POST", "/api/doctors", d) as { doctor: Doctor };
    const doctor = data.doctor;
    setDoctors(cur => [...cur, doctor]);
    return doctor;
  }, []);

  const updateDoctor = useCallback(async (id: number, patch: Partial<Doctor>) => {
    const data = await apiMutate("PATCH", `/api/doctors/${id}`, patch) as { doctor: Doctor };
    setDoctors(cur => cur.map(d => d.id === id ? data.doctor : d));
  }, []);

  const deleteDoctor = useCallback(async (id: number) => {
    await apiMutate("DELETE", `/api/doctors/${id}`);
    setDoctors(cur => cur.filter(d => d.id !== id));
    // Null out doctorId on patients whose doctor was deleted (local state)
    setPatients(cur => cur.map(p => p.doctorId === id ? { ...p, doctorId: null as unknown as number } : p));
    // Null out doctorId on prescriptions (local state)
    setPrescriptions(cur => cur.map(rx => rx.doctorId === id ? { ...rx, doctorId: null as unknown as number } : rx));
  }, []);

  /* ── Settings ── */

  const updateSettings = useCallback(async (patch: Partial<ClinicSettings>) => {
    const data = await apiMutate("PATCH", "/api/settings", patch) as { settings: ClinicSettings };
    setSettings(data.settings);
  }, []);

  /* ── Provider ── */
  return (
    <Ctx.Provider
      value={{
        loading,
        error,
        patients, addPatient, updatePatient, deletePatient, deletePatientsMany,
        prescriptions, addPrescription, updatePrescription,
        medicines, addMedicine, updateMedicine, deleteMedicine,
        doctors, addDoctor, updateDoctor, deleteDoctor,
        settings, updateSettings,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
