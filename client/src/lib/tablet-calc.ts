/**
 * Tablet calculator (frontend mirror of api/index.js helpers).
 *
 * Given a prescription line {dose, frequency, duration} and the medicine unit,
 * returns the number of tablets/capsules expected to be consumed.
 *
 * Frequency aliases supported:
 *   OD / QD / QAM / QPM / HS / Night / once / daily = 1 dose/day
 *   BD / BID / twice                                  = 2 doses/day
 *   TDS / TID                                         = 3 doses/day
 *   QID / QDS                                         = 4 doses/day
 *   Q4H/Q6H/Q8H/Q12H                                  = 24 / hours
 *   "1-0-1"-style strings                             = sum of digits
 *   PRN / SOS / STAT                                  = 0 (not counted)
 *
 * Duration accepts a number (days), or "5 days", "1 week", "2 wks", "1 month".
 */

export type CalcItem = {
  medicineId?: number | null;
  dose?: string;
  frequency?: string;
  duration?: number | string;
  qty?: number;
};

export function calcDosesPerDay(freq?: string): number {
  if (freq == null) return 0;
  const s = String(freq).trim().toLowerCase();
  if (!s) return 0;
  if (/^prn$|^sos$|^stat$/.test(s)) return 0;
  if (/^[\d.]+(?:\s*[-/+]\s*[\d.]+)+$/.test(s)) {
    return s.split(/[-/+]/).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  const qm = s.match(/q\s*(\d+)\s*h/);
  if (qm) {
    const hrs = parseInt(qm[1]);
    if (hrs > 0) return Math.max(1, Math.round(24 / hrs));
  }
  if (/\bqid\b|\bqds\b/.test(s)) return 4;
  if (/\btds\b|\btid\b/.test(s)) return 3;
  if (/\bbid\b|\bbd\b|\btwice\b/.test(s)) return 2;
  if (/\bod\b|\bqd\b|\bqam\b|\bqpm\b|\bhs\b|\bnight\b|\bonce\b|\bdaily\b/.test(s)) return 1;
  const tm = s.match(/(\d+)\s*(?:x|times)/);
  if (tm) return parseInt(tm[1]) || 0;
  return 0;
}

export function calcTabletsPerDose(dose?: string, medicineUnit?: string): number {
  if (!dose) {
    const u = String(medicineUnit ?? "").toLowerCase();
    return /^(tab|cap|capsule|tablet)/.test(u) ? 1 : 0;
  }
  const s = String(dose).toLowerCase();
  const tabRegex = /(\d+(?:\.\d+)?|\d+\/\d+|½|¼|¾)\s*(?:tab|tablet|cap|capsule)s?\b/;
  const m = s.match(tabRegex);
  if (m) {
    const raw = m[1];
    if (raw === "½") return 0.5;
    if (raw === "¼") return 0.25;
    if (raw === "¾") return 0.75;
    if (/\//.test(raw)) {
      const [a, b] = raw.split("/").map(Number);
      return b ? a / b : 0;
    }
    return parseFloat(raw) || 0;
  }
  if (/\bml\b|\bdrop|\bsachet|\bpuff|\binh|\bunit\b/.test(s)) return 0;
  const u = String(medicineUnit ?? "").toLowerCase();
  if (/^(tab|cap|capsule|tablet)/.test(u)) return 1;
  return 0;
}

export function calcDurationDays(item: CalcItem): number {
  if (!item) return 0;
  if (typeof item.duration === "number" && item.duration > 0) return item.duration;
  const txt = String(item.duration ?? "").toLowerCase();
  if (!txt) return 0;
  const m = txt.match(/(\d+(?:\.\d+)?)\s*(day|days|d|week|weeks|wk|wks|w|month|months|mo)/);
  if (!m) {
    const n = parseFloat(txt);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(m[1]);
  const unit = m[2];
  if (/^d/.test(unit)) return n;
  if (/^w/.test(unit)) return n * 7;
  if (/^mo?/.test(unit)) return n * 30;
  return n;
}

/** Tablets a prescription line will consume. Non-tablet units return 0. */
export function calcTabletsForItem(item: CalcItem, medicineUnit?: string): number {
  if (!item) return 0;
  const u = String(medicineUnit ?? "tab").toLowerCase();
  if (!/^(tab|cap|capsule|tablet)/.test(u)) return 0;
  const tabletsPerDose = calcTabletsPerDose(item.dose, u);
  const dosesPerDay = calcDosesPerDay(item.frequency);
  const days = calcDurationDays(item);
  let calc = tabletsPerDose * dosesPerDay * days;
  if (!Number.isFinite(calc) || calc <= 0) {
    const q = parseFloat(String(item.qty ?? ""));
    if (Number.isFinite(q) && q > 0) calc = q;
  }
  return Math.max(0, Math.round(calc));
}
