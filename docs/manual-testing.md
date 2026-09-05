# UniFit Manual Test Checklist

For the tester. Record every result: build ID, device/model, Android
version, and date. Mark **Pass / Fail / N/A** and attach a note/screenshot
for every Fail.

## Build info to record

- Build date and EAS build ID:
- Device/model/Android version:
- App version:
- Backend URL:
- Test account:

## 1. Auth & onboarding

- [ ] Fresh install → splash → onboarding → sign up
- [ ] Sign out and sign in with the same account
- [ ] Restart the app while signed in; session restores
- [ ] Logout during a slow profile load never lands in onboarding
- [ ] Demo account visible in preview build; not visible in production build
- [ ] Retake quiz, answer differently, submit; Home uses the new plan
- [ ] Retake quiz and cancel; previous profile/plan still works
- [ ] Password reset email → recovery link opens update-password screen; wrong/expired link shows an error

## 2. Profile → plan consistency

- [ ] Change diet/activities/equipment → all screens refresh to the new revision
- [ ] Home, Food, Progress, Calendar show the same plan week
- [ ] Today = Rest shows Rest banner; Today = Workout shows that workout
- [ ] Tomorrow card matches the scheduled date
- [ ] Calendar day opens the correct user's workout
- [ ] Logging a workout on one date does not mark another date complete

## 3. Camera coach (device required)

For each engine you can test (MoveNet always; MediaPipe on dev/release):

- [ ] Camera permission request appears
- [ ] Permission denied shows manual-count fallback and recovers after granting
- [ ] Calibrate no-movement → calibration fails with retry
- [ ] Calibrate a normal range → calibration completes
- [ ] Reps count on real movement; no reps when standing still
- [ ] Green skeleton appears ~0.5s after good form and clears on sustained bad form
- [ ] Bilateral (lunge/curl/row): complete right side, then left; right does not count during left
- [ ] Pause/rest between sets behaves
- [ ] Exit mid-load and re-enter; no frozen state
- [ ] Background app mid-session and resume; no ghost reps
- [ ] Repeated enter/exit 20 cycles without crash (record result)
- [ ] Full completion saves once; no duplicate on repeated finish taps
- [ ] Partial save appears once

## 4. Offline durability

- [ ] Enable airplane mode, finish an activity/camera session
- [ ] "Saved on this device" is shown
- [ ] Force-close app; reconnect; reopen; syncs exactly once
- [ ] Switch accounts before sync; old queue must not appear under new account
- [ ] Delete an activity offline; deletion syncs once when online

## 5. Activity tracking

- [ ] Guided walk/run/cycle/swim: start → pause → resume → finish excludes paused time
- [ ] Guided session duration and optional distance save
- [ ] Manual entry with duration/distance saves
- [ ] Two manual entries of the same activity both survive
- [ ] Edit an activity and delete an activity
- [ ] Weekly movement card sums guided + manual minutes/distance, calories unknown

## 6. Food

- [ ] Daily meal plan matches selected date
- [ ] Calendar picker opens and changes date
- [ ] Log a planned meal
- [ ] Search a database food and log with gram quantity
- [ ] Log a custom food
- [ ] Edit quantity/nutrients; totals change
- [ ] Delete a logged meal
- [ ] Home consumed/remaining calories update after returning to Home
- [ ] Unknown nutrients stay unknown (no invented zeros/percentages)

## 7. Progress & streaks

- [ ] Workout count does not increase per exercise log; one workout = one
- [ ] Active minutes come from real durations only
- [ ] Day streak uses distinct calendar days
- [ ] Monthly consistency uses active days
- [ ] Journey milestones only appear after real active days
- [ ] Calendar shows issued plans and completed days, never cycling/running templates the user didn't choose
- [ ] Values agree after backend/app restart

## 8. Layout & accessibility

- [ ] Quiz/Home/Workout/Activity/Food/Progress readable at 320dp and 412dp
- [ ] 200% system text scale: no clipped numbers or off-screen content
- [ ] TalkBack announces actions and state
- [ ] Captions show the same actionable correction as audio
- [ ] No duplicate spoken announcement + TalkBack for the same event
- [ ] Keyboard doesn't hide inputs in Food/Quiz

## 9. Security & data ownership

- [ ] Account A data never appears after signing into account B
- [ ] No profile/plan/queue/meal/activity leakage across sign-out/in
- [ ] Backend rejects requests with another user's ID (403)

## Final summary

- Total Pass / Fail / N/A:
- Critical failures (must fix before release):
- Notes/attachments:
