/**
 * ClinicPulse App Store
 *
 * Provides React Context state for patients, prescriptions, medicines, and doctors.
 *
 * On mount: fetches all four resource lists from the API in parallel.
 * All mutations: call the corresponding API endpoint, then update local state
 * on success — ensuring data survives Vercel cold starts and page reloads.
 *
 * Persistence: Postgres via POSTGRES_URL (set in Vercel project settings).
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
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

/* ── Context types ───────────────────────────────────────────────────────── */

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

  /* ── Bootstrap: fetch all resources on mount ── */
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [pRes, rxRes, medRes, drRes] = await Promise.all([
          apiFetch("/api/patients"),
          apiFetch("/api/prescriptions"),
          apiFetch("/api/medicines"),
          apiFetch("/api/doctors"),
        ]);

        if (cancelled) return;

        const pData = pRes as { patients?: Patient[] };
        const rxData = rxRes as { prescriptions?: Prescription[] };
        const medData = medRes as { medicines?: Medicine[] };
        const drData = drRes as { doctors?: Doctor[] };

        if (Array.isArray(pData?.patients))   setPatients(pData.patients);
        if (Array.isArray(rxData?.prescriptions)) setPrescriptions(rxData.prescriptions);
        if (Array.isArray(medData?.medicines)) setMedicines(medData.medicines);
        if (Array.isArray(drData?.doctors))   setDoctors(drData.doctors);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          // If DB is not configured fall back to seed data silently
          if (msg.includes("503") || msg.includes("Database unavailable") || msg.includes("POSTGRES_URL")) {
            console.warn("ClinicPulse: DB not available, using seed data.", msg);
          } else {
            console.error("ClinicPulse: Failed to load data from API.", msg);
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

  // updateMedicine stays local (no PATCH endpoint needed for now)
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

  /* ── Provider ── */
  return (
    <Ctx.Provider
      value={{
        loading,
        error,
        patients, addPatient, updatePatient, deletePatient, deletePatientsMany,
        prescriptions, addPrescription, updatePrescription,
        medicines, addMedicine, updateMedicine, deleteMedicine,
        doctors, addDoctor, updateDoctor,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
