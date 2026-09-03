# Ponytail Audit — Over-Engineering Findings

> One-shot report. Findings only — nothing was deleted. Ranked biggest cut first.

## Findings

1. `delete:` Public re-exports of every mock service in `services/index.ts` — nothing outside `services/` imports them; the API layer imports its fallbacks directly. `delete: export { mockWorkoutService ... }` block (7 exports). Replacement: keep only what `services/api/*` imports. [`services/index.ts`](/D:/College/3rd%20Year/SIH/UniFit/services/index.ts)

2. `delete:` `MOCK_WEEKLY_DAYS` export — used only internally by `buildPersonalizedWeek`; the file's own comment says it's the base template. Not imported anywhere else. [`services/mock/workoutMock.ts`](/D:/College/3rd%20Year/SIH/UniFit/services/mock/workoutMock.ts)

3. `delete:` `ENGINE_EXERCISES` as a public contract — imported only by `mock/cvMock.ts`, which is itself the CV mock boundary never used by the live app (see #1). When the mock-service re-export block goes, both become internal.

4. `delete:` `services/mock/progressMock.ts` `DEFAULT_PROGRESS` + whole file — `services/api/progressApi.ts` no longer imports it (empty-state fallback replaced it). [`services/api/progressApi.ts`](/D:/College/3rd%20Year/SIH/UniFit/services/api/progressApi.ts)

5. `delete:` `services/mock/activityMock.ts` `ENGINE_ACTIVITY_SESSIONS` + fake session list — `services/api/activityApi.ts` now reads real `/api/v1/sessions`. The file exists only for the (now unreachable) exported singleton. Verify no test imports it, then remove.

6. `delete:` `src/cv/sessionEvents.ts` module-level listener set — only two callers, one emits and one subscribes through the same file; a plain callback prop or a ref on the workout screen would do, but this is low priority (it works and is small).

7. `yagni:` Two nearly identical day-picking helpers existed (`pickDayFromWeek` duplicated once in nutritionApi and once in mealApi) — already consolidated into `combinedPlan.ts`. Nothing to do; noted as done.

8. `shrink:` `createCalibration`/`normalizeCalibration` + `repCounter` use several tiny one-use helpers across `calibration.ts`/`feedback.ts`/`repCounter.ts`. They're cohesive CV math; merging files would reduce file count but not complexity meaningfully — skipped.

9. `delete:` `streakData.ts` was already removed (fabricated calendar). Tracked in git history only.

10. `delete:` `DEFAULT_NUTRITION_TARGETS` fabrications in mocks were already emptied to zeros (honest-data pass). Kept as the offline fallback shape.

11. `delete:` `progressMock.ts`/`streakMock.ts` export references in `services/index.ts` after #4/#5 — the singletons are dead outside their files.

12. `yagni:` The 60+ style constants/theme duplication between `constants/colors.ts`, `typography.ts`, `layout.ts` is duplicated into many component-local `StyleSheet`s. Central tokens exist but components re-declare colors — worth a design-token sweep, not urgent.

## Net

Potential: **−700–900 lines** (dominated by `activityMock.ts`'s 5-session fixture + `workoutMock.ts` export surface) and **−7 public exports** if #1–#5 are applied. Nothing else rises to "must delete" — the repo is mostly deliberate.

## What this audit intentionally did NOT flag

- Correctness bugs, security, or performance — out of scope (see `docs/performance.md`).
- Expo "unused" dependencies (`expo-constants`, `react-native-screens`, etc.) — they're auto-linked by Expo even without source imports; do not remove.
- `scripts/` data-builders — one-shot but tracked and documented (used to generate the engine CSVs).
- Mock fallbacks themselves — they serve the offline/no-backend case; only the *unused public re-exports* and *fake-session fixtures* are dead.
