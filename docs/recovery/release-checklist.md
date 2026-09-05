# UniFit Recovery — Release Acceptance Checklist (W13)

Purpose: the manual pass after the sprint. Backend/tests already cover logic; this is the on-device gate.

## Preflight

- [ ] Branch `codex/recovery` merged to `main` and deployed
- [ ] `SUPABASE_JWT_SECRET` and `UNIFIT_AUTH_MODE=live` on the backend host
- [ ] Migrations `20260905000002` … `20260905000006` applied
- [ ] `npm run typecheck`, `npm test`, `pytest backend/tests` all green
- [ ] Release APK built with EAS and its build id recorded in `docs/recovery/acceptance-evidence.md`

## Critical journeys (device)

- Fresh install → signup → quiz → Home; answers survive restart
- Retake quiz then cancel; old profile/plan still usable
- Profile change → plan revision updates every screen
- Open workout from Home and Calendar; user identity is honored
- Camera session on a release build: 20 entry/exit cycles, background/resume, permission denied/revoked
- Camera failure → manual continuation, no duplicate or lost work
- Guided activity (walk/run/cycle/swim) → pause/resume/finish; values persist
- Manual activity entry and edit/delete
- Log planned meal, database food, custom food; edit/delete; Home calories update
- Offline activity save → restart → reconnect → exactly one sync (pending queue)
- Sign out account A → account B: no cross-user plan/queue/log leakage
- TalkBack + 200% text on quiz, Home, workout, activity, food, progress

## Rollback

- Reverse deploy to the previous `main` build; migrations are additive and safe to keep.
- Old app releases continue to work in dev/legacy mode while backend is in `live` mode for the current user only.

## Evidence

- Screenshots per journey and any crash logs go into `docs/recovery/acceptance-evidence.md`.
- No item is marked passed until a real device record exists.
