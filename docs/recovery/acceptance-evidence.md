# UniFit Recovery — Acceptance Evidence Index

Living index of evidence produced by each package.

| Package | Automated tests | Fixtures | Device/build evidence | Location/notes |
|---|---|---|---|---|
| W00 | typecheck 1/1; vitest 45/45; pytest 7/12 w/ live env | — | — | Baseline commit `166b7d3` |
| W01 | pytest 24/24; vitest 45/45; typecheck pass | token fixtures in `backend/tests/test_auth.py` | pending | Live-token verification requires `SUPABASE_JWT_SECRET`; recovery-link navigation needs device/simulator |
| W02 | pytest profile API 5/5; vitest 45/45; typecheck | full-field round-trip; 409 concurrency | pending | Migration `20260905000002` must be applied to live Supabase |
| W03 (backend identity + shared store) | plan-identity pytest 3/3; vitest 45/45; typecheck | snapshot reuse + profile-edit regeneration | pending | Migration `20260905000003` required |
| W04 | pytest 5/5 personalization; vitest 45/45; typecheck | equipment/experience matrix | pending | Combined accessibility + presentation wiring still needs UI regression |
| W05 | pending | pending | pending | — |
| W05 | pytest idempotency; vitest 45/45; typecheck | operation-id retry | pending | Migration `20260905000004`; offline pending queue still required |
| W06 | pytest plan-denominator 5/5; full backend 37/37 | planned obligations vs attempts | pending | Snapshots feed streak denominators; milestones/calendar remain |
| W07 | typecheck; vitest 45/45 | lifecycle code fixes only | user device test required | Foreground gating + cancellation boundaries added; device cycles still needed |
| W08 | pending | pending | user device test required | — |
| W09 | typecheck; vitest | unknown values stay unknown | pending | Guided timers/manual entry UI still to add |
| W09 (sprint) | pytest activity log 1/1; typecheck | guided/manual round trip | pending | Needs APK rebuild |
| W10 | pytest meal-log CRUD 2/2 | full nutrient snapshot; cross-user 404 | pending | Migration `20260905000005`; UI edit/date navigation partial |
| W10 (round 2) | typecheck | food search/edit sheet | pending | Needs app rebuild for UI verification |
| W11 | pending | pending | pending | — |
| W12 | pending | pending | pending | — |
| W13 | pending | pending | pending | — |

No fabricated stats or demo metrics are presented as real data anywhere in this repository.
