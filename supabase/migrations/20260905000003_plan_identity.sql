-- ====================================================================
-- W03: Revision-aware plan snapshots and scheduled-workout identity
-- ====================================================================

-- Progression revision: bumped every time the durable progression state is
-- advanced or recomputed, so plan identity can detect progression changes.
ALTER TABLE public.user_progress_state
  ADD COLUMN IF NOT EXISTS progression_revision BIGINT NOT NULL DEFAULT 1;

-- One row per generated plan snapshot. Older snapshots for the same week are
-- superseded (status = 'superseded') but retained for history/audit.
CREATE TABLE IF NOT EXISTS public.user_plan_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  profile_revision BIGINT NOT NULL,
  progression_revision BIGINT NOT NULL DEFAULT 1,
  engine_version TEXT NOT NULL,
  rule_data_version TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date, profile_revision, progression_revision,
         engine_version, rule_data_version)
);

CREATE INDEX IF NOT EXISTS idx_plan_snapshots_active
  ON public.user_plan_snapshots(user_id, week_start_date, status);

-- Stable per-day identity. A scheduled workout is identified by user+date and
-- can be re-served by later plan versions without breaking session records.
CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.user_plan_snapshots(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  activity_id TEXT NOT NULL,
  requested_activity_id TEXT,
  progression_key TEXT,
  session_type TEXT,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  prescription JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_date
  ON public.scheduled_workouts(user_id, local_date);

ALTER TABLE public.user_plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plan snapshots"
  ON public.user_plan_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own plan snapshots"
  ON public.user_plan_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plan snapshots"
  ON public.user_plan_snapshots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own scheduled workouts"
  ON public.scheduled_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own scheduled workouts"
  ON public.scheduled_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scheduled workouts"
  ON public.scheduled_workouts FOR UPDATE USING (auth.uid() = user_id);
