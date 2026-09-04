ALTER TABLE public.user_workout_sessions
  ADD COLUMN IF NOT EXISTS exercise_completion_pct JSONB;
