export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    ok: true,
    message: "If an account exists, a reset code has been sent.",
    demoCode: "123456",
    expiresInMinutes: 15
  });
}