ALTER TABLE public.user_workout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'camera',
  ADD COLUMN IF NOT EXISTS reps_completed INTEGER;
