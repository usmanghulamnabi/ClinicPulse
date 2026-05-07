const DEMO_ACCOUNTS = [
  { email: "admin@clinicpulse.app", password: "demo1234", role: "admin", fullName: "Dr. Sara Khan", avatarUrl: "" },
  { email: "doctor@clinicpulse.app", password: "demo1234", role: "doctor", fullName: "Dr. Adeel Rahman", avatarUrl: "" },
  { email: "front@clinicpulse.app", password: "demo1234", role: "receptionist", fullName: "Maria Lopez", avatarUrl: "" },
  { email: "pharm@clinicpulse.app", password: "demo1234", role: "pharmacist", fullName: "Imran Yousaf", avatarUrl: "" },
  { email: "patient@clinicpulse.app", password: "demo1234", role: "patient", fullName: "Ali Hassan", avatarUrl: "" },
];

const resetCodes = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function makeResetCode(email) {
  const digits = Buffer.from(`${email}:${Date.now()}`).toString("base64url").replace(/[^0-9]/g, "");
  return (digits + "246810").slice(0, 6);
}

export default function handler(req, res) {
  const url = new URL(req.url || "/", "https://clinicpulse.local");
  const rewrittenPath = url.searchParams.get("path");
  const path = rewrittenPath ? `/api/${rewrittenPath}` : url.pathname;
  const method = req.method || "GET";
  const body = getBody(req);

  if (method === "GET" && path.endsWith("/api/health")) {
    return send(res, 200, { ok: true, app: "ClinicPulse", runtime: "vercel" });
  }

  if (method === "POST" && path.endsWith("/api/auth/login")) {
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const account = DEMO_ACCOUNTS.find((item) => item.email.toLowerCase() === email && item.password === password);

    if (!account) {
      return send(res, 401, { error: "Invalid email or password" });
    }

    const token = Buffer.from(JSON.stringify({ email: account.email, role: account.role, t: Date.now() })).toString("base64url");
    return send(res, 200, {
      token,
      user: {
        email: account.email,
        role: account.role,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl,
      },
    });
  }

  if (method === "POST" && path.endsWith("/api/auth/password/request")) {
    const email = normalizeEmail(body.email);
    if (!email || !email.includes("@")) {
      return send(res, 400, { error: "A valid email is required." });
    }

    const account = DEMO_ACCOUNTS.find((item) => item.email.toLowerCase() === email);
    if (account) {
      resetCodes.set(email, { code: makeResetCode(email), expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });
    }

    return send(res, 200, {
      ok: true,
      message: "If an account exists, a reset code has been sent.",
      expiresInMinutes: 15,
    });
  }

  if (method === "POST" && path.endsWith("/api/auth/password/reset")) {
    const email = normalizeEmail(body.email);
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!email || !code || newPassword.length < 8) {
      return send(res, 400, { error: "Email, reset code, and a password of at least 8 characters are required." });
    }

    const reset = resetCodes.get(email);
    if (!reset || reset.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return send(res, 400, { error: "Reset code is invalid or expired." });
    }

    if (reset.attempts >= 5) {
      resetCodes.delete(email);
      return send(res, 429, { error: "Too many reset attempts. Request a new code." });
    }

    if (reset.code !== code) {
      reset.attempts += 1;
      return send(res, 400, { error: "Reset code is invalid." });
    }

    const account = DEMO_ACCOUNTS.find((item) => item.email.toLowerCase() === email);
    if (account) account.password = newPassword;
    resetCodes.delete(email);

    return send(res, 200, { ok: true, message: "Password updated. You can sign in with your new password." });
  }

  if (method === "POST" && path.endsWith("/api/auth/signup")) {
    const email = normalizeEmail(body.email);
    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "doctor");

    if (!email || !fullName) {
      return send(res, 400, { error: "email and fullName required" });
    }

    return send(res, 200, { ok: true, user: { email, fullName, role } });
  }

  if (method === "GET" && path.endsWith("/api/auth/me")) {
    return send(res, 200, { user: DEMO_ACCOUNTS[0] });
  }

  return send(res, 404, { error: "API route not found" });
}
