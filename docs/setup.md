# Setup & Running UniFit

> From zero to running on a teammate's laptop, then on a phone.

## Prerequisites

- **Node.js 20 or 22 LTS** + npm
- **Expo SDK 52 tooling** (`npx expo` / Expo Go app for MoveNet-only runs)
- **Python 3.12/3.13** for the FastAPI backend
- A **Supabase project** (required for live persistence)

## 1. Clone and install

```bash
git clone https://github.com/mehtab-bit/UniFit.git
cd UniFit
git checkout main
npm install
```

## 2. Environment file

Copy `.env.example` → `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # private — never commit
SUPABASE_JWT_SECRET=<jwt-secret>               # private — never commit
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_DEMO_MODE=false
UNIFIT_AUTH_MODE=live                         # dev only for offline engine tests
SUPABASE_AUTH_REMOTE_FALLBACK=false           # optional fallback
```

Never commit `.env`.

## 3. Start the backend

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Health check: http://localhost:8000/api/v1/health

With a real Supabase project, the backend also requires `SUPABASE_JWT_SECRET`
to verify mobile sessions. Set it in `.env` (and Render) before signing in
from a device.

## 4. Run the app

### Option A — Expo Go (MoveNet only)

```bash
npx expo start
```

Scan the QR with Expo Go. The camera coach uses bundled MoveNet and never
requires a native build.

### Option B — Development build (native MediaPipe)

```bash
npx expo run:android
```

MediaPipe runs through Vision Camera's frame-processor plugin
(`plugins/withPoseLandmarker.js`). Choose **Profile → Camera Engine →
MediaPipe**; if the native plugin is missing the app falls back to MoveNet.

### Web

```bash
npm run web
# or for a production bundle
npx expo export -p web
```

## 5. Camera Engine preference

Profile → Camera Engine offers **Auto**, **MediaPipe**, and **MoveNet**. The
choice is stored per device and applies to the next camera session:

- **Auto** — MediaPipe when available, otherwise MoveNet.
- **MediaPipe** — Android development builds only.
- **MoveNet** — every build, including Expo Go and web.

## 6. Supabase (one-time setup)

```bash
supabase db push
```

This applies `supabase/migrations/*.sql` in timestamp order, including profile
revisions, plan snapshots, session idempotency, meal logs, and activity logs.
The demo account `demo@unifit.app` is created through the Supabase
dashboard/admin API (one-time).

## 7. EAS / Release

See [docs/deployment.md](docs/deployment.md). Preview APKs use
`eas build -p android --profile preview`; store release uses
`--profile production`. Never put service-role or JWT secrets in `eas.json`.

## Running tests

```bash
npm test            # Vitest — CV logic, quality, pose source, progression helpers
npx tsc --noEmit    # typecheck
pytest backend/tests/test_engine_api.py   # engine integration (in venv)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| API timeouts on phone | `.env` API URL must be the PC's LAN IP; backend must bind `0.0.0.0`; allow port 8000 in the firewall |
| Camera shows no skeleton | Model loads once per session; use a side view with the whole body in frame; see `docs/cv-coach.md` |
| MediaPipe option falls back | You're on Expo Go or a build without the native plugin; use `expo run:android` and Profile → Camera Engine → MediaPipe |
| Calibration seems off after switching engines | Calibrations are scoped per engine — recalibrate once under the newly selected engine |
| Web demo has no camera | The camera coach targets mobile; the web export serves the rest of the app |

## Architecture & deeper docs

- `docs/architecture.md` — full system map
- `docs/deployment.md` — EAS/Render/Supabase release steps
- `docs/engine.md` — the Python fitness engine
- `docs/cv-coach.md` — camera pose tracking, calibration, rep counting
