export default function handler(req: any, res: any) {
  return res.status(200).json({
    ok: true,
    app: "ClinicPulse",
    version: "0.1.0"
  });
}