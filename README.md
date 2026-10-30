# JALGUARD — AI Intervention Intelligence for Urban Water Resilience

**Predict the Risk. Choose the Right Intervention. Prevent the Damage.**

JALGUARD turns weather signals, geographic intelligence and field observations into clear
priorities and verifiable preventive action. Preview build: Next.js 16 · TypeScript ·
Tailwind 4 · shadcn/ui · Prisma (SQLite) · Leaflet · Recharts · next-intl (EN/हिन्दी).

## Run locally

```bash
bun install            # install dependencies
bun run db:push        # create/update the SQLite schema (Prisma)
bun scripts/seed.ts    # load the clearly-labelled DEMO dataset + demo accounts
bun run dev            # start on http://localhost:3000
bun run lint           # ESLint
```

> In the hosted sandbox, `bun run dev` is started automatically — open the **Preview
> panel** (or "Open in New Tab"). The user-visible route is `/`; all screens are
> client-side views rendered by `src/app/page.tsx`.

## Demo accounts (password `Demo#Pass1` — all data is labelled DEMO)

| Email | Role |
|---|---|
| `admin@jalguard.demo` | Platform Super Administrator |
| `officer@jalguard.demo` | Municipal Officer |
| `disaster@jalguard.demo` | Disaster Management |
| `field@jalguard.demo` | Field Operations |
| `field2@jalguard.demo` | Field Operations |
| `analyst@jalguard.demo` | Data Analyst |
| `citizen@jalguard.demo` | Citizen |

## Workflows to try

- **A — Onboarding:** Sign up → demo email verification → role selection (privileged
  roles create a *server-side request*, citizen is immediate) → onboarding → dashboard.
- **B — Map:** Risk Map → search/fly, toggle layers, filter severity, open an asset →
  contributing factors + recommended action.
- **C — Incidents:** Report incident (click-to-place map) → appears in register + map →
  officer updates status → reporter is notified.
- **D — Field ops:** Officer accepts a recommendation → task auto-assigned → field user
  adds notes/evidence → submit → supervisor verifies or reopens.
- **E — Admin:** Admin approves/rejects a role request → permission takes effect
  server-side and is audited.
- **F/G:** Switch English/हिन्दी and light/dark themes — preferences persist.

## Honest data labelling

- Weather: live **Open-Meteo** when reachable (10-min server cache, 6 s timeout);
  otherwise a deterministic fallback clearly marked `SIMULATED`.
- Assets, incidents, tasks, assessments: demonstration records (`DEMO` tags).
- The risk engine is a **transparent rule engine (v0.9)** — not a validated predictive
  model. Every score shows source, factors, confidence and freshness.
- No email/SMS provider is configured: verification and password-reset tokens are
  surfaced in-app through explicitly labelled demo steps.
- Public advisories, dispatches and warnings **always require authorized human
  approval**; nothing is auto-published.

## Security model (preview)

- scrypt password hashing, httpOnly session cookies, DB-backed sessions.
- Server-side role checks on **every** API route (`requireUser` / `requireRole` /
  `requireAdmin`); privileged roles are never granted by UI selection.
- In-memory rate limiting on auth endpoints; audit log for privileged actions.
- Admin bootstrap: `POST /api/bootstrap` requires `BOOTSTRAP_ADMIN_KEY` (server env
  only), generates a cryptographic temporary password once, forces a first-login
  change, and is idempotent (closes once a super admin exists).
- Secrets live only in the server environment — see `.env.example`.

## Production notes (out of scope for this preview)

Supabase Auth + Postgres + RLS and Storage are the recommended upgrade path; swap the
Prisma layer and replace the demo verification/reset steps with a real mail provider.
Keep map tile attribution (© OpenStreetMap contributors, © CARTO) and respect provider
usage policies.
