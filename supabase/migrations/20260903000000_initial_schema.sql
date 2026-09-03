-- ====================================================================
-- UniFit Comprehensive Supabase Database Schema
-- Matches Engine Data Contract & Static CSV Schemas Exactly
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. DYNAMIC USER TABLES
-- ====================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER CHECK (age >= 14),
  sex TEXT CHECK (sex IN ('male', 'female')),
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  fitness_goal TEXT CHECK (fitness_goal IN ('lose_fat', 'fat_loss', 'maintain', 'muscle_gain')),
  lifestyle_activity TEXT CHECK (lifestyle_activity IN ('sedentary', 'light', 'moderate', 'very_active')),
  diet TEXT CHECK (diet IN ('vegan', 'vegetarian', 'eggetarian', 'non_vegetarian')),
  accessibility_needs TEXT[] DEFAULT '{}'::TEXT[],
  accessibility_other_details TEXT,
  has_exercise_restriction BOOLEAN DEFAULT FALSE,
  exercise_restriction_description TEXT,
  strength_equipment TEXT[] DEFAULT '{}'::TEXT[],
  strength_equipment_other TEXT,
  strength_experience TEXT CHECK (strength_experience IN ('new', 'some_experience', 'regularly_train')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Activity Preferences
CREATE TABLE IF NOT EXISTS public.user_activity_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL CHECK (activity IN ('walking', 'running', 'cycling', 'swimming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Accessibility Resources
CREATE TABLE IF NOT EXISTS public.user_accessibility_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cached Weekly Fitness Plans (Engine Output)
CREATE TABLE IF NOT EXISTS public.user_weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- Progression State
CREATE TABLE IF NOT EXISTS public.user_progress_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_week INTEGER NOT NULL DEFAULT 1,
  overall_completion_pct NUMERIC(5,2),
  activity_rule_week JSONB NOT NULL DEFAULT '{}'::JSONB,
  exercise_rule_week JSONB NOT NULL DEFAULT '{}'::JSONB,
  strength_variation_levels JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workout Sessions Log
CREATE TABLE IF NOT EXISTS public.user_workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  requested_activity_id TEXT,
  progression_key TEXT NOT NULL,
  session_type TEXT,
  completion_pct NUMERIC(5,2) NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercise Logs (Per Exercise Reps/Completion)
CREATE TABLE IF NOT EXISTS public.user_exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.user_workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_family TEXT NOT NULL,
  variation_id TEXT,
  completion_pct NUMERIC(5,2) NOT NULL,
  reps_completed INTEGER,
  sets_completed INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Meal Plans
CREATE TABLE IF NOT EXISTS public.user_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  diet TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- ====================================================================
-- 2. STATIC SEED TABLES (Matching CSV Data Exactly)
-- ====================================================================

-- Foods (foods_100_final.csv)
CREATE TABLE IF NOT EXISTS public.foods (
  food_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source_food_name TEXT,
  food_group TEXT,
  food_role TEXT,
  diet_class TEXT,
  vegan_ok BOOLEAN,
  vegetarian_ok BOOLEAN,
  eggetarian_ok BOOLEAN,
  nonveg_ok BOOLEAN,
  contains_dairy BOOLEAN,
  contains_egg BOOLEAN,
  contains_meat BOOLEAN,
  contains_fish BOOLEAN,
  breakfast_ok BOOLEAN,
  lunch_ok BOOLEAN,
  snack_ok BOOLEAN,
  dinner_ok BOOLEAN,
  ingredient_only BOOLEAN,
  energy_kcal NUMERIC(7,2),
  protein_g NUMERIC(7,2),
  carbohydrate_g NUMERIC(7,2), -- NULL if missing in IFCT source
  fat_g NUMERIC(7,2),
  fiber_g NUMERIC(7,2),        -- NULL if missing in IFCT source
  protein_per_100kcal NUMERIC(7,2),
  protein_level TEXT,
  carbohydrate_status TEXT,
  fiber_status TEXT,
  regions TEXT,
  source_page TEXT,
  nutrition_source TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Meals (meals.csv)
CREATE TABLE IF NOT EXISTS public.meals (
  meal_id TEXT PRIMARY KEY,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  diet_class TEXT,
  vegan_ok BOOLEAN,
  vegetarian_ok BOOLEAN,
  eggetarian_ok BOOLEAN,
  nonveg_ok BOOLEAN,
  servings NUMERIC(4,2),
  total_kcal NUMERIC(7,2),
  total_protein_g NUMERIC(7,2),
  known_carbohydrate_g NUMERIC(7,2),
  total_fat_g NUMERIC(7,2),
  known_fiber_g NUMERIC(7,2),
  carbohydrate_complete BOOLEAN,
  fiber_complete BOOLEAN,
  protein_level TEXT,
  prep_note TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Meal Items (meal_items.csv)
CREATE TABLE IF NOT EXISTS public.meal_items (
  meal_item_id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL REFERENCES public.meals(meal_id) ON DELETE CASCADE,
  food_code TEXT NOT NULL REFERENCES public.foods(food_code) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity_g NUMERIC(7,2),
  quantity_basis TEXT
);

-- Activities (activities.csv)
CREATE TABLE IF NOT EXISTS public.activities (
  activity_id TEXT PRIMARY KEY,
  activity_name TEXT NOT NULL,
  selectable_in_onboarding BOOLEAN,
  mandatory BOOLEAN,
  minimum_sessions_per_week INTEGER,
  primary_metrics TEXT,
  description TEXT
);

-- Workout Templates (workout_templates.csv)
CREATE TABLE IF NOT EXISTS public.workout_templates (
  template_id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  session_type TEXT,
  title TEXT NOT NULL,
  intensity_default TEXT,
  warmup_description TEXT,
  main_description TEXT,
  cooldown_description TEXT
);

-- Exercise Variations (exercise_variations.csv)
CREATE TABLE IF NOT EXISTS public.exercise_variations (
  variation_id TEXT PRIMARY KEY,
  exercise_family TEXT NOT NULL,
  variation_name TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  equipment TEXT,
  description TEXT,
  form_cues TEXT
);

-- Strength Session Items (strength_session_items.csv)
CREATE TABLE IF NOT EXISTS public.strength_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_template_id TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  exercise_family TEXT NOT NULL,
  rep_mode TEXT
);

-- Lifestyle Schedule Rules (lifestyle_schedule_rules.csv)
CREATE TABLE IF NOT EXISTS public.lifestyle_schedule_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifestyle TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  active_days_target INTEGER NOT NULL,
  strength_sessions INTEGER NOT NULL,
  preferred_activity_sessions INTEGER NOT NULL,
  rest_days_target INTEGER NOT NULL,
  is_consolidation_week BOOLEAN NOT NULL
);

-- Progression Rules (progression_rules.csv)
CREATE TABLE IF NOT EXISTS public.progression_rules (
  rule_id TEXT PRIMARY KEY,
  lifestyle TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  activity_id TEXT NOT NULL,
  session_variant TEXT NOT NULL,
  template_id TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  rest_seconds INTEGER,
  recommended_variation_level INTEGER,
  distance_km NUMERIC(5,2),
  distance_m NUMERIC(7,2),
  duration_min INTEGER,
  interval_count INTEGER,
  work_interval_sec INTEGER,
  recovery_interval_sec INTEGER,
  intensity TEXT,
  advance_if_completion_pct NUMERIC(5,2),
  progression_note TEXT
);

-- Accessibility Profiles (accessibility_profiles.csv)
CREATE TABLE IF NOT EXISTS public.accessibility_profiles (
  accessibility_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  automatic_workout_adaptation BOOLEAN,
  audio_guidance BOOLEAN,
  visual_captions BOOLEAN,
  haptic_cues BOOLEAN,
  notes TEXT
);

-- Accessibility Resources (accessibility_resources.csv)
CREATE TABLE IF NOT EXISTS public.accessibility_resources (
  resource_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  accessibility_id TEXT NOT NULL,
  description TEXT
);

-- Accessibility Workout Templates (accessibility_workout_templates.csv)
CREATE TABLE IF NOT EXISTS public.accessibility_workout_templates (
  template_id TEXT PRIMARY KEY,
  accessibility_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  eligible_preference TEXT,
  session_type TEXT,
  title TEXT NOT NULL,
  required_resource TEXT,
  requires_guide BOOLEAN,
  use_distance BOOLEAN,
  use_duration BOOLEAN,
  intensity_default TEXT,
  warmup_audio TEXT,
  main_audio TEXT,
  cooldown_audio TEXT,
  safety_note TEXT
);

-- Accessibility Exercise Guidance (accessibility_exercise_guidance.csv)
CREATE TABLE IF NOT EXISTS public.accessibility_exercise_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id TEXT NOT NULL,
  accessibility_id TEXT NOT NULL,
  audio_instruction TEXT,
  orientation_cue TEXT,
  safety_note TEXT
);

-- Accessibility Progression Rules (accessibility_progression_rules.csv)
CREATE TABLE IF NOT EXISTS public.accessibility_progression_rules (
  rule_id TEXT PRIMARY KEY,
  accessibility_id TEXT NOT NULL,
  lifestyle TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  duration_min INTEGER,
  interval_count INTEGER,
  work_interval_sec INTEGER,
  recovery_interval_sec INTEGER,
  intensity TEXT,
  is_consolidation_week BOOLEAN,
  advance_if_completion_pct NUMERIC(5,2),
  progression_note TEXT
);

-- ====================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessibility_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own activity preferences" ON public.user_activity_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own activity preferences" ON public.user_activity_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own plans" ON public.user_weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON public.user_weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON public.user_weekly_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own progression" ON public.user_progress_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own progression" ON public.user_progress_state FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own sessions" ON public.user_workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.user_workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Static tables are readable by all authenticated and anonymous users
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read foods" ON public.foods FOR SELECT USING (true);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read meals" ON public.meals FOR SELECT USING (true);

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read meal items" ON public.meal_items FOR SELECT USING (true);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.workout_templates FOR SELECT USING (true);

ALTER TABLE public.exercise_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read variations" ON public.exercise_variations FOR SELECT USING (true);
