-- ====================================================================
-- W05/W06: Durable, idempotent session recording + plan-denominator math
-- ====================================================================

ALTER TABLE public.user_workout_sessions
  ADD COLUMN IF NOT EXISTS operation_id TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_workout_id UUID,
  ADD COLUMN IF NOT EXISTS local_date DATE,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- A client-generated operation id must never create a duplicate recording.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_workout_session_operation
  ON public.user_workout_sessions(operation_id)
  WHERE operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_scheduled
  ON public.user_workout_sessions(user_id, scheduled_workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_local_date
  ON public.user_workout_sessions(user_id, local_date);

-- RLS for exercise logs is already enabled in the initial schema; keep the
-- parent table ownership policies consistent for update/delete as needed.
CREATE POLICY "Users update own sessions"
  ON public.user_workout_sessions FOR UPDATE USING (auth.uid() = user_id);
