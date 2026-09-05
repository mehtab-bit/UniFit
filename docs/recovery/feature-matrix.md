# UniFit Recovery — Feature Coverage Matrix

Status: living document. Key: ✅ working (repo evidence) · 🔶 partial · ❌ defective · ⛔ unreachable/unverified · 🚧 in progress.

| Capability | Owner | Status | Acceptance scenario |
|---|---|---|---|
| Sign up / sign in with Supabase | Supabase Auth + app | 🔶 | Email confirmation; session refresh; restart |
| Password reset link flow | Supabase Auth + app | ❌ | Deep link opens update screen; expiry/reuse handled |
| Demo entry (explicit, isolated) | Frontend | 🔶 | Only `EXPO_PUBLIC_DEMO_MODE=true`; demo account isolated |
| Authenticated user APIs | FastAPI | ❌ | Cross-user ID rejected with 401/403 |
| Profile save/read (all quiz fields) | Backend + DB | ❌ | Fresh-client readback equals submitted answers |
| Atomic activities + accessibility resources | Backend + DB | ❌ | Retake/cancel keeps previous commit usable |
| Plan generation from committed profile | Backend | ❌ | Profile edit → new plan revision |
| Plan identity/snapshot/refresh | Backend + shared store | ❌ | Every screen observes same revision |
| Scheduled-workout identity | Backend + DB | ❌ | Day lookup cannot load another user's plan |
| Equipment/experience personalization | Engine | 🔶 | One-field profile pairs change plan rules |
| Combined accessibility (vision+hearing presentation) | Engine + UI | ❌ | Both needs survive to plan + presentation |
| Restriction/"other" honesty | Engine/API | 🔶 | Notes preserved; unsupported → explicit result |
| Durable idempotent session save | Backend + local queue | ❌ | Retry once → one record |
| Manual/camera session parity | App | 🔶 | Same prescription either way; no lost work |
| Weekly adherence vs issued schedule | Backend | ❌ | 5 logs one day → 1 active day; ≤100% |
| Progression advance once/week, 8-week hold | Backend | ❌ | Week close, restart, repeat close |
| Home/Activity/Progress/Calendar agreement | Backend + app | ❌ | Same fixture same numbers after restart |
| Real meal logging (plan/food/custom) | Backend + app | ❌ | Log/edit/delete updates totals |
| Nutrient completeness + honest NaN guards | API + UI | ❌ | Unknown values stay unknown; no fixed bars |
| Guided + manual activity (walk/run/cycle/swim) | App | ❌ | No GPS claims; no ×7 calories |
| Camera lifecycle on Android | Native/TS | ⛔ | User device evidence required (20 cycles etc.) |
| Accessibility presentation in session | App | 🔶 | Audio/captions/haptics honored per need |
| Layout at 320–412dp + 200% text | App | 🔶 | No clipped content (device matrix needed) |
| Diagnostics/deploy reproducibility | Backend/CI | 🔶 | Request IDs; pinned env; reproducible build |

This matrix is updated as packages are verified; unverified device items remain unverified until user evidence is supplied.
