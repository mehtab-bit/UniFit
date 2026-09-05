# UniFit Mobile App — Universal Fitness

> **Brand Name:** UniFit
> **Primary Tagline:** UNIVERSAL FITNESS
> **Secondary Tagline:** FITNESS WITHOUT BARRIERS, PROGRESS WITHOUT LIMITS

A demo-ready Expo + React Native app backed by the `vijul` Python fitness
engine (FastAPI), Supabase persistence, and an on-device camera coach with
both MoveNet and native MediaPipe pose engines.

## Documentation

- [docs/architecture.md](docs/architecture.md) — how all the pieces connect
- [docs/engine.md](docs/engine.md) — the Python fitness engine (plans, nutrition, progression)
- [docs/cv-coach.md](docs/cv-coach.md) — camera pose tracking, calibration, rep counting, form feedback
- [docs/setup.md](docs/setup.md) — running it on your laptop and phone
- [docs/deployment.md](docs/deployment.md) — EAS builds, Render env, and Supabase migrations
- [docs/performance.md](docs/performance.md) — measured timings and what to profile next
- [docs/audit.md](docs/audit.md) — historical over-engineering audit
- [docs/recovery/final-status.md](docs/recovery/final-status.md) — current recovery status and open gaps

> Note: `graphify-out/` is a locally generated code-map produced by the
> graphify tool. It is not part of the repository and is not required to
> build or run UniFit.

## Key Features

1. **Personalized Fitness Plans** — Workouts tailored to goals, fitness level, preferences, and abilities.
2. **Dietary Personalization** — Food recommendations based on Vegetarian, Vegan, Eggetarian, or Non-Vegetarian preferences.
3. **Exercise Coach** — Live camera coaching for squats, lunges, push-ups, curls, and rows with calibration-based rep counting and range scores.
4. **Adaptive Progression** — Weekly plans adjust via backend 80% progression gates.
5. **Inclusive & Accessible Fitness** — Audio guidance, captions, haptics, and accessibility-aware workout adaptation.
6. **Multi-Activity Tracking** — Walking, running, cycling, swimming, and strength session logging.
7. **Pose Engine Selection** — Profile → Camera Engine picks Auto, MediaPipe (dev builds), or MoveNet (Expo Go / fallback), persisted per device.
8. **Manual Counting Fallback** — Camera-free rep counting with audio/haptic confirmation and no fabricated scores.
9. **Real Meal Logging** — Planned meals, catalog foods, or custom entries with quantity editing and day navigation.
10. **Offline Durability** — Failed activity/camera saves queue on-device and replay under the same account when connected.

## Screen Flow

```
First Launch:
Splash Screen → Onboarding Tour → Login/Sign Up → Onboarding Quiz → Home

Home Tabs:
Home · Activity · Food · Progress · Profile

Supporting screens (navigated from Home/Workout):
Workout / Exercise Coach · Streak & Plan · CV Session · Manual Session
```

## Repositories & Branch

The final integrated product lives on the **`main`** branch. `deep-frontend`
and `deep-onlyfrontend` are upstream UI source branches; `vijul-engine` is the
standalone engine history. The Python engine and FastAPI backend are
maintained inside this repo (see `backend/` and `engine/`).

## Deployment

The app ships from `main` through **EAS** for Android and **Render** for the
FastAPI backend. Client-safe `EXPO_PUBLIC_*` values live in `eas.json`;
private backend credentials are set only in the Render dashboard and local
`.env` files. See [docs/deployment.md](docs/deployment.md).

Demo entry is gated: `EXPO_PUBLIC_DEMO_MODE=true` only in the EAS preview
profile; release builds keep it `false`.

## Quick Start

```bash
git clone https://github.com/mehtab-bit/UniFit.git
cd UniFit
git checkout main
npm install
```

Run the camera coach with MoveNet in **Expo Go**:

```bash
npm start
```

Or build a **development build** to enable native MediaPipe:

```bash
npx expo run:android
```

Start the backend when you want live engine plans instead of mocks:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

See [docs/setup.md](docs/setup.md) for the complete setup.

## Verification

```bash
npm test                          # Vitest (CV logic, pose source, progression helpers)
npx tsc --noEmit                  # TypeScript typecheck
pytest backend/tests/test_engine_api.py   # Backend contract tests
npx expo export -p web            # Production web bundle sanity check
```
