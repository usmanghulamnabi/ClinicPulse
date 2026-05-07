export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, newPassword } = req.body ?? {};

  if (String(code) !== "123456") {
    return res.status(400).json({ error: "Reset code is invalid." });
  }

  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters."
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Password updated. You can sign in with the new password."
  });
}