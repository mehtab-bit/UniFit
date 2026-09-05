# UniFit Recovery — Work Package Ledger

Each package lists problem, expected behavior, required files, tests, completion criteria, and status. Packages W00–W13 match the PLAN. Small reviewable sub-items are ticked as they land.

## W00 — Inventory and evidence baseline

Status: 🚧 (inventory above, artifacts created; sub-item verification ongoing)

## W01 — Secure and stabilize identity

Problem: every user-specific backend operation trusts caller-supplied `user_id`; frontend can load indefinitely; recovery flow incomplete.

Required:
- [x] Backend bearer-token verification dependency (`Authorization: Bearer <Supabase JWT>`)
- [x] Ownership enforcement on profile/plan/session/progress/meal/streak routes
- [x] Profile load outside `onAuthStateChange`
- [x] Stale-session/old-user guard, session-expiry normalization
- [x] Password-recovery deep-link flow (update password, expired/reused link errors)
- [x] Explicit isolated demo path
- [x] Tests: missing/expired token; cross-user; refresh; restart; logout during load; recovery links; demo switching

Done when: no user can access another user's data; auth transitions cannot leave the app loading indefinitely.

## W02 — Complete and truthful onboarding persistence

Problem: quiz fields are dropped/defaulted; saves can appear successful when the database failed; activities live in a separate table not read back atomically.

Required:
- [x] `GET/PUT /api/v1/profile/me` atomic profile+preferences+resources contract
- [x] Persistent `profile_revision`; `409` on concurrent conflicting edits
- [x] All quiz fields preserved, including combined accessibility selection and "other" notes
- [x] Error propagation from storage helpers; no false-success path
- [x] Retake prefill from current profile; cancel restores previous committed profile/plan
- [x] Incomplete profile never displays as a personalized default
- [x] Tests: round-trips, clearing activities, multi-accessibility, DB failure, retake cancel, restart mid-quiz, simultaneous edits

## W03 — Plan identity, caching, refresh

Problem: plan cache ignores profile/content changes; date lookups can use default-user fallbacks; screens regenerate independently.

Required:
- [x] Revision-aware plan identity (user, week start, profile/progression revisions, engine/data version)
- [x] Persisted plan snapshots with stable IDs; scheduled-workout identity
- [x] Single shared frontend plan store; refresh after profile save
- [x] Obsolete in-flight responses ignored
- [ ] Loading/stale/unavailable/failed states surfaced across screens

## W04 — Engine personalization completeness

Required:
- [ ] Field influence matrix; equipment eligibility; experience rules; accessibility resources; multi-need strategy (primary adaptation + combined presentation)
- [ ] CSV validation of ids/units/tags/resources
- [ ] Explanation metadata for supported input effects
- [ ] Determinism tests

## W05 — Durable idempotent sessions

Required:
- [x] Scheduled-workout and exercise-attempt identity; operation IDs; transactional persistence
- [ ] Local pending queue; retry/user separation
- [x] No success broadcast before durable save
- [ ] Partial/discard/back handling on camera screens

## W06 — Progression & summaries

Required: plan-based denominators; persisted state; reconstructible history; calendar from snapshots; correct distinct-day counts; milestones from achievements; timezone rules.
- [x] Plan-based denominators (planned obligations, capped attempts)
- [x] Persisted state with progression revision
- [x] Correct distinct-day streak/adherence vs issued schedule
- [ ] Calendar from snapshots; milestones from achievements
- [ ] Fully reconstructible history across workers

## W07 — Camera/workout lifecycle

Required: stack placement above tabs; conditional camera activation; session tokens; disposal on cancellation; error forwarding; route validation; unified exit policy; device evidence.
- [x] Conditional camera activation on foreground
- [x] Disposal on cancellation (model + GL/generator)
- [ ] Stack placement above tabs; unified exit policy
- [ ] Device evidence: 20 entry/exit cycles, background/resume, permission revoke

## W08 — Coaching accuracy & manual parity

Required: variation coverage check; calibration identity; low-confidence behavior; manual continuation; honest range-score labeling; accessibility channels.

## W09 — Activity tracking

Required: guided/manual sessions for walking/running/cycling/swimming; pause/resume; honest unknown values; persisted filters/summaries.

## W10 — Food logging

Required: plan/food/custom logging; quantity edit; delete; date selection; snapshots; completeness; progress computation; plan-date corrections.

## W11 — Layout/navigation/accessibility

Required: shared tokens/layout primitives; content-driven sizes; safe areas; keyboard; text scale; caption/announcement coordination; reduced motion; control states.

## W12 — Performance/diagnostics/deployment

Required: meal planner retains top-candidate optimization (verify); parsed data cache; duplicate-generation guard; readiness vs liveness; request IDs; pinned backend env; release-build identity; CI smoke.

## W13 — Migration, regression, pilot

Required: additive migrations; legacy preservation; explicit backfill; release APK acceptance matrix; docs update; rollback procedure.
