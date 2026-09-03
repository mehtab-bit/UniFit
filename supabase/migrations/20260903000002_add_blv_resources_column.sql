-- Add blind_low_vision_resources to profiles for users who are already
-- registered; the initial schema already carries it for fresh installs.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blind_low_vision_resources TEXT[] DEFAULT '{}'::TEXT[];
