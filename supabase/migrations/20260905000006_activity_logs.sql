-- ====================================================================
-- W09: Guided and manual activity tracking
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('walking', 'running', 'cycling', 'swimming')
  ),
  local_date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('guided', 'manual')),
  operation_id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  active_duration_seconds INTEGER,
  duration_minutes NUMERIC(6,1),
  distance_km NUMERIC(6,2),
  distance_entered BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_log_operation
  ON public.user_activity_logs(operation_id)
  WHERE operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON public.user_activity_logs(user_id, local_date);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity logs"
  ON public.user_activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity logs"
  ON public.user_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own activity logs"
  ON public.user_activity_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own activity logs"
  ON public.user_activity_logs FOR DELETE USING (auth.uid() = user_id);
