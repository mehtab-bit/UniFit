-- ====================================================================
-- W10: Real meal logging
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.meal_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  meal_type TEXT CHECK (
    meal_type IN ('breakfast', 'lunch', 'evening_snack', 'dinner')
  ),
  source TEXT NOT NULL CHECK (
    source IN ('planned_meal', 'food', 'custom')
  ),
  plan_meal_id TEXT,
  food_code TEXT,
  custom_name TEXT,
  quantity NUMERIC(8,2) NOT NULL,
  quantity_unit TEXT NOT NULL DEFAULT 'serving'
    CHECK (quantity_unit IN ('serving', 'gram', 'piece')),
  nutrition_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  completeness_flags JSONB NOT NULL DEFAULT '{}'::JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON public.meal_log_entries(user_id, local_date);

ALTER TABLE public.meal_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own meal logs"
  ON public.meal_log_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meal logs"
  ON public.meal_log_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meal logs"
  ON public.meal_log_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meal logs"
  ON public.meal_log_entries FOR DELETE USING (auth.uid() = user_id);
