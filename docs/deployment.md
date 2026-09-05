# UniFit Deployment Guide

Operative checklist for shipping the Android app (EAS) and FastAPI backend
(Render) from `main`.

## Environment split

### Client-safe (in `eas.json`, embedded in the APK)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key for RLS client |
| `EXPO_PUBLIC_API_URL` | Render API URL (`https://unifit-api.onrender.com`) |
| `EXPO_PUBLIC_DEMO_MODE` | `true` only in preview profile |

### Private (backend only; never in `eas.json` or client bundles)

| Variable | Purpose | Where to set |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB writes | Render dashboard + local `.env` |
| `SUPABASE_JWT_SECRET` | Verifies mobile session JWTs | Render dashboard + local `.env` |
| `UNIFIT_AUTH_MODE` | `live` in deployment | Render via `render.yaml` |
| `SUPABASE_AUTH_REMOTE_FALLBACK` | `true` recommended on Render | Render via `render.yaml` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Remote token-check endpoint | Render dashboard (publishable key) |

## Supabase migrations

Apply in order before testing new builds:

1. `20260903000000_initial_schema.sql`
2. `20260903000001_seed_data.sql`
3. `20260903000002_profile_contract.sql`
4. `20260903000003_plan_identity.sql`
5. `20260903000004_session_idempotency.sql`
6. `20260903000005_meal_logs.sql`
7. `20260903000006_activity_logs.sql`

Confirm seed data (`foods`, `meals`, workout CSVs) exists for meal/plan flows.

## Render

1. Push `main`; the Render web service deploys from `render.yaml`.
2. Render → unifit-api → Environment: set `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `SUPABASE_JWT_SECRET` (values synced from dashboard/local).
3. Verify `https://unifit-api.onrender.com/api/v1/health` returns 200.
4. Sign in from the app and load Home before submitting to EAS.

## EAS builds

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview      # internal APK, demo ON
npx eas-cli build -p android --profile production   # store AAB, demo OFF
```

`preview` is installable and keeps demo enabled for the tester account.
`production` turns demo off and requires Play Console credentials when
submitting.

## Before you push

```bash
npm run typecheck
npm test
python -m pytest backend/tests -q
git status --short   # must not list .env, npx, dist/, android/, node_modules/
```

## Rollback

- Render: redeploy previous commit or disable service.
- Migrations are additive; keep them, do not drop columns.
- EAS: previous build remains installable while new build is produced.
