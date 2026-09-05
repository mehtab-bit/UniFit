# UniFit Recovery — Acceptance Evidence Index

Living index of evidence produced by each package.

| Package | Automated tests | Fixtures | Device/build evidence | Location/notes |
|---|---|---|---|---|
| W00 | typecheck; vitest 47/47 | baseline inventory | — | Baseline commit `166b7d3` |
| W01 | pytest auth 12; typecheck | token fixtures | device required for recovery link | Needs `SUPABASE_JWT_SECRET` live |
| W02 | pytest profile 5; typecheck | full-field round-trip; 409 | pending | Migration `...02` |
| W03 | pytest plan identity 3; typecheck | snapshot reuse + profile edit | pending | Migration `...03`; history/version gaps remain |
| W04 | pytest personalization 5; typecheck | equipment/experience matrix | pending | CSV validation/accessibility UI regression remain |
| W05 | pytest idempotency; typecheck | operation-id retry; activity/camera queue | pending | Migration `...04`; meal queue not offline |
| W06 | pytest plan denominators; full backend 46 | snapshots/attempts/milestones | pending | Week rollover caller still needed |
| W07 | typecheck | lifecycle code fixes | user device test required | Device cycles still required |
| W08 | — | — | user device test required | No accuracy evidence |
| W09 | pytest activity 1; typecheck | guided/manual round trip | pending | APK verification needed |
| W10 | pytest meal logs 2; typecheck | CRUD/search/edit | pending | Migration `...05` |
| W11 | typecheck | layout fixes on reported screens | pending | 320/360/412dp + 200% text matrix |
| W12 | typecheck | rule-data cache | pending | Readiness/CI/release identity remain |
| W13 | typecheck | release checklist | user device/release required | Checklist in `docs/recovery/release-checklist.md` |

No fabricated stats or demo metrics are presented as real data anywhere in this repository.
