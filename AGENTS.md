# Repository Guidelines

UniFit is an Expo/React Native fitness app (TypeScript) backed by a FastAPI service, a pure-Python "vijul" engine, Supabase, and an on-device camera coach with MediaPipe/MoveNet pose engines. Contributions land on `main`.

## Project Structure

- `app/` — Expo Router screens (`(app)` tabs, `(auth)`, onboarding, `cv-session`).
- `components/`, `context/`, `hooks/`, `utils/`, `constants/`, `types/` — UI, state, and shared types.
- `services/` — data access: `api/` calls FastAPI, `mock/` holds offline fallbacks.
- `lib/` — Supabase client and profile persistence.
- `src/cv/` — on-device pose detection, rep counting, calibration, and quality logic.
- `backend/` — thin FastAPI app (`routes/`, `services/`, `schemas/`).
- `engine/` — deterministic Python fitness engine; `data/` holds its CSV rule databases.
- `supabase/migrations/` — SQL schema changes (timestamped, additive).
- `assets/`, `plugins/`, `scripts/`, `docs/` — media, the native MediaPipe plugin, tooling, and design docs.

## Commands

```bash
npm install              # install app dependencies
npx expo start           # run app (Expo Go uses MoveNet)
npm run android          # native build (enables MediaPipe)
npm run web              # run web app
npm run typecheck        # lint/type gate: tsc --noEmit
npm test                 # Vitest suite (src/**/*.test.ts)
```

Backend (from repo root, inside a venv):

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --port 8000
pytest backend/tests/test_engine_api.py
```

## Coding Style

- TypeScript is strict; use `@/*` imports. Two-space indent; no ESLint/Prettier config — match surrounding code.
- Name components and screen files in `PascalCase.tsx`, pure logic modules in `camelCase.ts`, routes in `kebab-case`.
- Keep business rules in the Python engine; `backend/` stays a thin HTTP/validation layer.
- Python follows PEP 8 with dataclasses and pure, deterministic functions.

## Testing

- Add Vitest tests for CV logic and pure TypeScript helpers: `src/cv/__tests__/*.test.ts`, using `describe`/`it`.
- Backend behavior is covered by `backend/tests/test_engine_api.py`; extend it when endpoints change.
- No fabricated stats or demo metrics may be presented as real data.

## Commits & Pull Requests

- Use conventional-commit style (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`) with a concise imperative summary, matching recent history.
- PRs need a short description of what changed and why, plus screenshots or a quick demo link for UI/CV changes.
- Keep migrations backward-compatible and additive. Larger architecture context belongs in `docs/` (`architecture.md`, `cv-coach.md`, `engine.md`).
