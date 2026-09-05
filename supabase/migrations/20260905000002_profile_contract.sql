-- ====================================================================
-- W02: Atomic committed-profile contract
-- --------------------------------------------------------------------
-- The profile row becomes the single committed source of truth for all
-- onboarding answers, including activity preferences and accessibility
-- resources. user_activity_preferences / user_accessibility_resources
-- remain for legacy compatibility but are no longer required for reads.
-- profile_revision enables optimistic concurrency (409 on stale edits).
-- ====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_activities TEXT[]
    DEFAULT '{}'::TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_revision BIGINT NOT NULL DEFAULT 1;

-- Backfill preferred_activities from the legacy normalized table where the
-- profile row has none. Deterministic ordering keeps reads stable.
UPDATE public.profiles p
SET preferred_activities = COALESCE(
  ARRAY(
    SELECT uap.activity
    FROM public.user_activity_preferences uap
    WHERE uap.user_id = p.user_id
    ORDER BY uap.created_at, uap.activity
  ),
  '{}'::TEXT[]
)
WHERE COALESCE(array_length(p.preferred_activities, 1), 0) = 0;
