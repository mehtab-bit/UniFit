-- ====================================================================
-- UniFit Supabase Database Schema
-- Universal Fitness Platform - Profiles & Activity Preferences
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER CHECK (age >= 18),
  sex TEXT CHECK (sex IN ('male', 'female')),
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  fitness_goal TEXT CHECK (fitness_goal IN ('lose_fat', 'maintain', 'muscle_gain')),
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

-- 2. USER ACTIVITY PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_activity_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL CHECK (activity IN ('walking', 'running', 'cycling', 'swimming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_prefs_user_id ON public.user_activity_preferences(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_preferences ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. RLS POLICIES FOR USER ACTIVITY PREFERENCES
CREATE POLICY "Users can view own activity preferences"
  ON public.user_activity_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity preferences"
  ON public.user_activity_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity preferences"
  ON public.user_activity_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 5. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'UniFit Athlete'),
    FALSE
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
