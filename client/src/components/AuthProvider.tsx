import { createContext, useContext, useState } from "react";
import { USERS, type Role } from "@/lib/seed-data";
import { apiRequest } from "@/lib/queryClient";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  initials: string;
  branchId: number;
  specialty: string | null;
};

const Ctx = createContext<{
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: Role) => void;
}>({
  user: null,
  login: async () => ({ ok: false }),
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default: not logged in. Auth state is in-memory (no localStorage in sandbox).
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message.replace(/^401:\s*/, "") : "Unable to sign in.",
      };
    }

    const u = USERS.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, error: "No account found for that email." };
    setUser({
      id: u.id, email: u.email, fullName: u.fullName, role: u.role,
      initials: u.initials, branchId: u.branchId, specialty: u.specialty,
    });
    return { ok: true };
  };

  const logout = () => setUser(null);

  const switchRole = (role: Role) => {
    const u = USERS.find(x => x.role === role) ?? USERS[0];
    setUser({
      id: u.id, email: u.email, fullName: u.fullName, role: u.role,
      initials: u.initials, branchId: u.branchId, specialty: u.specialty,
    });
  };

  return <Ctx.Provider value={{ user, login, logout, switchRole }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
