# Setup & Running UniFit

> From zero to running on a teammate's laptop, then on a phone.

## Prerequisites

- **Node.js 20 or 22 LTS** + npm
- **Expo Go** on your phone (from the Play Store / App Store) — this project targets **Expo SDK 52**; do not upgrade to SDK 53+ for this milestone
- **Python 3.12/3.13** (3.14 may work, but the team venv uses a compatible version)
- A **Supabase project** (live URL + keys) — optional but recommended for auth/profiles
- Windows firewall may need an inbound rule for port 8000 to reach the backend from a phone

## 1. Clone and install

```bash
git clone https://github.com/mehtab-bit/UniFit.git
cd UniFit
git fetch origin
git checkout merge-cv
npm install
```

## 2. Environment file

Copy `.env.example` → `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # private — never commit
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_DEMO_MODE=false
```

The **service-role key must never be committed**; distribute it out-of-band to teammates only.

## 3. Start the backend

```bash
# one-time (Windows) — use the repo's venv if present
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r backend/requirements.txt

# run it (the --host 0.0.0.0 is what makes it reachable from a phone)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Health check: http://localhost:8000/api/v1/health or http://<your-LAN-IP>:8000/api/v1/health

## 4. Start Expo

```bash
npx expo start
```

- **Real phone:** scan the QR with Expo Go (same Wi-Fi).
- **Emulator:** press `a` (Android) or `i` (iOS).
- **Web:** press `w`.

The first plan request after a cold backend can take ~20 s while the engine generates the week — later loads are fast (cached).

## 5. Point the phone at the backend

`localhost` inside Expo Go means the phone itself. If API calls time out, edit `.env`:

```bash
EXPO_PUBLIC_API_URL=http://<your-PC-LAN-IP>:8000
```

Find your LAN IP with `ipconfig` (Windows) / `ifconfig` (macOS). Restart `npx expo start` after editing. If the phone still can't reach it, allow port 8000 inbound in Windows Firewall.

## 6. Supabase (one-time setup)

With the Supabase CLI linked to the project:

```bash
supabase db push
```

This applies `supabase/migrations/*.sql` (schema + seed). The demo account `demo@unifit.app` is created through the dashboard/admin API (one-time).

For local-only testing without Supabase, the app falls back to local storage + mock services.

## Running tests

```bash
npm test            # Vitest — CV logic, quality, side selection
npx tsc --noEmit    # typecheck
pytest backend/tests/test_engine_api.py   # engine integration (in venv)
```

## Teammate checklist

1. Clone + `npm install`.
2. Copy `.env.example` → `.env`; set your own Supabase keys + `EXPO_PUBLIC_API_URL`.
3. Start backend (venv, `--host 0.0.0.0`) — or skip it; the app falls back to mocks.
4. `npx expo start`, scan QR.

## Troubleshooting

| Problem | Fix |
|---|---|
| API timeouts on phone | `.env` API URL must be the PC's LAN IP; backend must bind `0.0.0.0`; allow port 8000 in firewall |
| "Maximum update depth" warnings in CV | Already fixed in code — reload Expo Go with a fresh bundle; restart with `npx expo start -c` if stale |
| EPERM `.pytest_cache` Metro warning | Already ignored in `metro.config.js`; restart Metro |
| CV shows no dots | Model loads once per session (~seconds). Use side view, whole body in frame; see `docs/cv-coach.md` |
| `supabase db push` Docker errors | Docker Desktop must be running, or use `supabase db push --linked` |

## Architecture & deeper docs

- `docs/architecture.md` — full system map.
- `docs/engine.md` — the Python fitness engine.
- `docs/cv-coach.md` — camera pose tracking and calibration.
- `graphify-out/` — an auto-built knowledge graph of the codebase.
