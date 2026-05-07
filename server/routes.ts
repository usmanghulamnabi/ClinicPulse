import type { Express } from "express";
import type { Server } from 'node:http';

/**
 * Demo accounts (in-memory) — the deployed preview is a demo build.
 * Production would use the Drizzle/Prisma users table with bcrypt + JWT/NextAuth.
 */
const DEMO_ACCOUNTS = [
  { email: "admin@clinicpulse.app",   password: "demo1234", role: "admin",        fullName: "Dr. Sara Khan",      avatarUrl: "" },
  { email: "doctor@clinicpulse.app",  password: "demo1234", role: "doctor",       fullName: "Dr. Adeel Rahman",   avatarUrl: "" },
  { email: "front@clinicpulse.app",   password: "demo1234", role: "receptionist", fullName: "Maria Lopez",        avatarUrl: "" },
  { email: "pharm@clinicpulse.app",   password: "demo1234", role: "pharmacist",   fullName: "Imran Yousaf",       avatarUrl: "" },
  { email: "patient@clinicpulse.app", password: "demo1234", role: "patient",      fullName: "Ali Hassan",         avatarUrl: "" },
];

const passwordResetCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

function makeResetCode(email: string) {
  const base = Buffer.from(`${email}:${Date.now()}`).toString("base64url").replace(/[^0-9]/g, "");
  return (base + "246810").slice(0, 6);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => res.json({ ok: true, app: "ClinicPulse", version: "0.1.0" }));

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const u = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === normalizeEmail(email) && a.password === password);
    if (!u) return res.status(401).json({ error: "Invalid email or password" });
    // mock JWT — production would sign with NEXTAUTH_SECRET
    const token = Buffer.from(JSON.stringify({ email: u.email, role: u.role, t: Date.now() })).toString("base64url");
    res.json({ token, user: { email: u.email, role: u.role, fullName: u.fullName, avatarUrl: u.avatarUrl } });
  });

  app.post("/api/auth/password/request", (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email || !email.includes("@")) return res.status(400).json({ error: "A valid email is required." });

    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    const code = account ? makeResetCode(email) : "000000";
    if (account) {
      passwordResetCodes.set(email, { code, expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });
    }

    // Production: never return the code. Send it via email/SMS and always return a generic ok.
    res.json({
      ok: true,
      message: "If an account exists, a reset code has been sent.",
      demoCode: account ? code : undefined,
      expiresInMinutes: 15,
    });
  });

  app.post("/api/auth/password/reset", (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code ?? "").trim();
    const newPassword = String(req.body?.newPassword ?? "");

    if (!email || !code || newPassword.length < 8) {
      return res.status(400).json({ error: "Email, reset code, and a password of at least 8 characters are required." });
    }

    const reset = passwordResetCodes.get(email);
    if (!reset || reset.expiresAt < Date.now()) {
      passwordResetCodes.delete(email);
      return res.status(400).json({ error: "Reset code is invalid or expired." });
    }
    if (reset.attempts >= 5) {
      passwordResetCodes.delete(email);
      return res.status(429).json({ error: "Too many reset attempts. Request a new code." });
    }
    if (reset.code !== code) {
      reset.attempts += 1;
      return res.status(400).json({ error: "Reset code is invalid." });
    }

    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    if (account) account.password = newPassword;
    passwordResetCodes.delete(email);
    res.json({ ok: true, message: "Password updated. You can sign in with the new password." });
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, fullName, role } = req.body ?? {};
    if (!email || !fullName) return res.status(400).json({ error: "email and fullName required" });
    res.json({ ok: true, user: { email, fullName, role: role ?? "doctor" } });
  });

  app.get("/api/auth/me", (_req, res) => {
    res.json({ user: DEMO_ACCOUNTS[0] });
  });

  return httpServer;
}
