const DEMO_ACCOUNTS = [
  { email: "admin@clinicpulse.app", password: "demo1234", role: "admin", fullName: "Dr. Sara Khan", avatarUrl: "" },
  { email: "doctor@clinicpulse.app", password: "demo1234", role: "doctor", fullName: "Dr. Adeel Rahman", avatarUrl: "" },
  { email: "front@clinicpulse.app", password: "demo1234", role: "receptionist", fullName: "Maria Lopez", avatarUrl: "" },
  { email: "pharm@clinicpulse.app", password: "demo1234", role: "pharmacist", fullName: "Imran Yousaf", avatarUrl: "" },
  { email: "patient@clinicpulse.app", password: "demo1234", role: "patient", fullName: "Ali Hassan", avatarUrl: "" }
];

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body ?? {};
  const user = DEMO_ACCOUNTS.find(
    account =>
      account.email.toLowerCase() === String(email ?? "").toLowerCase() &&
      account.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = Buffer.from(
    JSON.stringify({ email: user.email, role: user.role, t: Date.now() })
  ).toString("base64url");

  return res.status(200).json({
    token,
    user: {
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl
    }
  });
}