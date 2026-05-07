# ClinicPulse

A modern, multi-tenant, multi-branch clinic management SaaS — EMR, prescriptions, inventory, scheduling, billing, analytics, AI insights, audit, and a patient portal — in one premium UI.

> **Demo notice.** This preview build uses **in-memory demo data** (84 patients, 220 prescriptions, 25 medicines, 12 months of finance) so reviewers can explore every flow without provisioning a database or third-party credentials. The `prisma/schema.prisma` file is the production data model for migrating to Postgres on Vercel.

> **Medical disclaimer.** ClinicPulse is a productivity / clinic management tool. The AI features (insights, drug-interaction alerts, refill predictions, OCR, transcription) are **assistive demos** that do **not** constitute medical advice and **must not** be used as the sole basis for clinical decisions. Independent verification by a licensed clinician is always required.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5000
```

For a production-style local run:

```bash
npm run build
npm start            # http://localhost:5000
```

### Demo accounts (all share password `demo1234`)

| Role         | Email                       | Sees                                                           |
| ------------ | --------------------------- | -------------------------------------------------------------- |
| Admin        | `admin@clinicpulse.app`     | Everything across all branches, finance, audit, settings       |
| Doctor       | `doctor@clinicpulse.app`    | Patients, prescriptions, appointments, AI insights, analytics  |
| Receptionist | `front@clinicpulse.app`     | Appointments, patient registration, billing                    |
| Pharmacist   | `pharm@clinicpulse.app`     | Inventory, prescriptions queue                                 |
| Patient      | `patient@clinicpulse.app`   | Patient Portal only (own prescriptions, appointments, bills)   |

---

## Modules

1. **Auth + RBAC** — 5 roles, sidebar/route filtering, in-memory session
2. **Password reset** — request code, verify token, update password; preview shows demo code, production schema stores hashed reset tokens
3. **Dashboard** — executive command center, KPIs, branch roll-up, queue, collections, margins, recent activity, AI operating notes
4. **Patients** — searchable directory, MRN, allergies, chronic conditions, visit timeline, SOAP notes, lab reports
5. **Prescriptions** — dynamic builder with allergy alerts, duplicate detection, AI suggestions, pediatric dose calculator, RX templates (HTN/DM/Asthma/URI/Gastro/Fever), print-ready ℞ output, WhatsApp/email/PDF share
6. **Inventory** — pharmacy stock, reorder levels, expiry tracking, in/out logs
7. **Appointments** — day / queue / week views, drag-friendly time slots
8. **Patient Portal** — prescriptions, upcoming appointments, bills, secure messaging
9. **Reports** — library, daily closing, financial, doctor performance
10. **Finance** — billing, payment status, methods, multi-currency-ready
11. **AI / Automation** — assistive triage, refill prediction, OCR, voice notes (all clearly disclaimed)
12. **Notifications** — in-app dropdown, channel preferences (email / WhatsApp / SMS / push)
13. **Multi-branch** — per-branch isolation with admin roll-up, branch switcher in topbar
14. **Security & Audit** — active sessions, audit log, password reset tokens, user management
15. **Database** — Drizzle (sqlite preview) + Prisma (Postgres production schema)

---

## Tech stack

| Layer        | Preview (this repo)                                 | Production (recommended)                            |
| ------------ | --------------------------------------------------- | --------------------------------------------------- |
| Framework    | React 18 + Vite + Express                           | Next.js 15 App Router on Vercel                     |
| Language     | TypeScript everywhere                               | TypeScript everywhere                               |
| UI           | shadcn/ui + Tailwind CSS v3 + Framer Motion         | same                                                |
| Charts       | Recharts                                            | same                                                |
| Forms        | React Hook Form + Zod                               | same                                                |
| State        | React Context + TanStack Query                      | + Zustand for non-server state                      |
| ORM          | Drizzle (better-sqlite3)                            | Prisma + Postgres (Neon / Supabase)                 |
| Auth         | Server-validated demo login + reset-code flow       | NextAuth/Auth.js credentials, 2FA, email reset      |
| Files        | n/a                                                 | S3 / R2 for lab reports                             |
| Notifications| Mocked                                              | SendGrid + WhatsApp Business + browser push         |
| Payments     | Mocked                                              | Stripe                                              |
| AI           | Static suggestions                                  | OpenAI (server-side, rate-limited, audited)         |

---

## Vercel deployment (production path)

1. Push this repo to GitHub.
2. On Vercel: **New Project** → import → framework auto-detected.
3. Provision a Postgres DB (Neon, Supabase, or Vercel Postgres).
4. Add the environment variables from `.env.example`.
5. Generate Prisma client: `npm run prisma:generate`.
6. Run migrations: `npm run prisma:migrate` or push during early staging with `npm run prisma:push`.
7. Replace `server/storage.ts` with a Prisma client adapter (the storage interface contract is unchanged).
8. Wire password-reset email delivery in `/api/auth/password/request` through SendGrid, Resend, or your SMTP provider. Store only hashed reset tokens from the `PasswordResetToken` model.
9. Deploy.

The `prisma/schema.prisma` file mirrors the Drizzle schema in `shared/schema.ts` 1:1, so migration is a drop-in.

### Password reset production notes

- Generate a high-entropy reset token with `crypto.randomBytes(32)`.
- Store `sha256(token)` in `PasswordResetToken.tokenHash`, never the raw token.
- Email a one-time link such as `${APP_URL}/reset-password?token=...`.
- Expire tokens after 15 minutes and mark `usedAt` after successful reset.
- Invalidate all active sessions for the user after changing the password.
- Add per-IP and per-email rate limiting to the request endpoint.

---

## Folder layout

```
clinicpulse/
├─ client/
│  └─ src/
│     ├─ components/        # AppShell, AuthProvider, ThemeProvider, Logo, KPI, ...
│     ├─ pages/             # 19 pages, one file per route
│     ├─ lib/demo-data.ts   # deterministic seed: patients, rx, finance, charts
│     └─ index.css          # design tokens (medical teal palette + dark mode)
├─ server/                  # Express routes + Drizzle storage
├─ shared/schema.ts         # Drizzle schema (preview)
├─ prisma/schema.prisma     # Prisma schema (production)
└─ README.md
```

---

## Brand

- **Mark** — teal tile + ECG pulse line
- **Palette** — calm teal/cyan/slate, accessible AA contrast in both modes
- **Type** — Inter (UI) + JetBrains Mono (data) — loaded over CDN
- **Motion** — subtle pulse + page fades. Reduce-motion respected.

---

## Keyboard shortcuts

`⌘K` palette · `g d` Dashboard · `g p` Patients · `g r` Prescriptions · `g a` Appointments · `g i` Inventory · `g b` Billing · `g n` Analytics · `?` help

---

## License

UNLICENSED — internal demo build.
