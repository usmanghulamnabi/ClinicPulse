import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/seed-data";
import { apiRequest, setAuthToken, getAuthToken } from "@/lib/queryClient";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  initials: string;
  branchId: number;
  specialty: string | null;
  doctorId?: number | null;
  mustChange?: boolean;
};

const USER_KEY = "cp_user";

function readStoredUser(): AuthUser | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

function writeStoredUser(u: AuthUser | null) {
  try {
    if (typeof localStorage === "undefined") return;
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

const Ctx = createContext<{
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: Role) => void;
  refresh: () => Promise<void>;
}>({
  user: null,
  login: async () => ({ ok: false }),
  logout: () => {},
  switchRole: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage so refresh keeps the session alive.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStoredUser();
    return getAuthToken() && stored ? stored : null;
  });

  // On mount, optionally refresh from /api/auth/me to keep user fresh
  useEffect(() => {
    if (!getAuthToken()) return;
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me");
        const data = await res.json() as { user: AuthUser };
        if (data?.user) {
          setUser(data.user);
          writeStoredUser(data.user);
        }
      } catch {
        // Token is invalid/expired — clear it
        setAuthToken(null);
        writeStoredUser(null);
        setUser(null);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json() as { token: string; user: AuthUser };
      setAuthToken(data.token);
      writeStoredUser(data.user);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message.replace(/^401:\s*/, "") : "Unable to sign in.",
      };
    }
  };

  const logout = () => {
    setAuthToken(null);
    writeStoredUser(null);
    setUser(null);
  };

  // switchRole kept for backward compatibility with any UI that uses it,
  // but it now only updates local state (will be cleared on refresh).
  const switchRole = (role: Role) => {
    if (!user) return;
    const next = { ...user, role };
    setUser(next);
    writeStoredUser(next);
  };

  const refresh = async () => {
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const data = await res.json() as { user: AuthUser };
      if (data?.user) {
        setUser(data.user);
        writeStoredUser(data.user);
      }
    } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ user, login, logout, switchRole, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
