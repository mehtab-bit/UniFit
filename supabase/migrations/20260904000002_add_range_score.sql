ALTER TABLE public.user_workout_sessions
  ADD COLUMN IF NOT EXISTS range_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS issue_codes JSONB;
