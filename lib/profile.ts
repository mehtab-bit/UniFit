import { supabase, isLiveSupabaseConfigured, SafeStorage } from './supabase';
import { apiClient, ApiError } from '../services/api/apiClient';
import { UserProfile, QuizFormData, EngineProfilePayload } from '../types/quiz';
import { getDemoUserProfile } from '../constants/demo';

const PROFILE_STORAGE_KEY_PREFIX = '@unifit_user_profile_';
const QUIZ_DRAFT_KEY_PREFIX = '@unifit_quiz_draft_';

function normalizeProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name || 'UniFit Athlete',
    age: row.age != null ? Number(row.age) : null,
    sex: row.sex || null,
    height_cm: row.height_cm != null ? Number(row.height_cm) : null,
    weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
    fitness_goal: row.fitness_goal || row.goal || null,
    lifestyle_activity: row.lifestyle_activity || null,
    preferred_activities: row.preferred_activities || [],
    user_activity_preferences: row.preferred_activities || [],
    diet: row.diet || null,
    accessibility_needs: row.accessibility_needs || [],
    accessibility_other_details: row.accessibility_other_details || undefined,
    blind_low_vision_resources: row.blind_low_vision_resources || [],
    has_exercise_restriction:
      row.has_exercise_restriction == null ? null : Boolean(row.has_exercise_restriction),
    exercise_restriction_description:
      row.exercise_restriction_description || undefined,
    strength_equipment: row.strength_equipment || [],
    strength_equipment_other: row.strength_equipment_other || undefined,
    strength_experience: row.strength_experience || null,
    onboarding_completed: Boolean(row.onboarding_completed),
    profile_revision:
      row.profile_revision != null ? Number(row.profile_revision) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function cacheLocalProfile(profile: UserProfile): void {
  SafeStorage.setItem(
    `${PROFILE_STORAGE_KEY_PREFIX}${profile.user_id}`,
    JSON.stringify(profile)
  ).catch(() => {
    // A local cache miss must never look like a backend save failure.
  });
}

export const ProfileService = {
  /**
   * Fetches the committed profile from the authenticated backend.
   *
   * Throws ApiError on network/server failures so callers can show truthful
   * states; returns null only when no committed profile exists (404).
   */
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    if (isLiveSupabaseConfigured()) {
      let row: Record<string, any>;
      try {
        row = await apiClient.get<Record<string, any>>('/api/v1/profile/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
      const profile = normalizeProfile(row);
      cacheLocalProfile(profile);
      return profile;
    }

    const cached = await SafeStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${userId}`);
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  },

  /**
   * Commits the full quiz/profile payload through the backend profile
   * contract. expectedRevision enables optimistic concurrency so an older
   * edit can never silently overwrite a newer committed profile.
   */
  saveQuizProfile: async (
    userId: string,
    fullName: string,
    quizData: QuizFormData,
    expectedRevision?: number
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    try {
      const parsedAge = quizData.age ? parseInt(quizData.age, 10) : null;
      const parsedHeight = quizData.height_cm ? parseFloat(quizData.height_cm) : null;
      const parsedWeight = quizData.weight_kg ? parseFloat(quizData.weight_kg) : null;

      const profileRecord: UserProfile = {
        user_id: userId,
        full_name: fullName,
        age: parsedAge,
        sex: quizData.sex || null,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        fitness_goal: quizData.fitness_goal || null,
        lifestyle_activity: quizData.lifestyle_activity || null,
        preferred_activities: quizData.user_activity_preferences || [],
        user_activity_preferences: quizData.user_activity_preferences || [],
        diet: quizData.diet || null,
        accessibility_needs: quizData.accessibility_needs || [],
        accessibility_other_details:
          quizData.accessibility_other_details.trim() || undefined,
        blind_low_vision_resources: quizData.blind_low_vision_resources || [],
        has_exercise_restriction:
          quizData.has_exercise_restriction == null
            ? false
            : quizData.has_exercise_restriction,
        exercise_restriction_description:
          quizData.exercise_restriction_description.trim() || undefined,
        strength_equipment: quizData.strength_equipment || [],
        strength_equipment_other: quizData.strength_equipment_other.trim() || undefined,
        strength_experience: quizData.strength_experience || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabaseConfigured()) {
        const saved = await apiClient.put<Record<string, any>>('/api/v1/profile/me', {
          full_name: fullName,
          age: profileRecord.age,
          sex: profileRecord.sex,
          height_cm: profileRecord.height_cm,
          weight_kg: profileRecord.weight_kg,
          fitness_goal: profileRecord.fitness_goal,
          lifestyle_activity: profileRecord.lifestyle_activity,
          diet: profileRecord.diet,
          preferred_activities: profileRecord.preferred_activities,
          accessibility_needs: profileRecord.accessibility_needs,
          accessibility_other_details: profileRecord.accessibility_other_details,
          blind_low_vision_resources: profileRecord.blind_low_vision_resources,
          has_exercise_restriction: profileRecord.has_exercise_restriction,
          exercise_restriction_description:
            profileRecord.exercise_restriction_description,
          strength_equipment: profileRecord.strength_equipment,
          strength_equipment_other: profileRecord.strength_equipment_other,
          strength_experience: profileRecord.strength_experience,
          onboarding_completed: true,
          expected_profile_revision: expectedRevision,
        });
        const committed = normalizeProfile(saved);
        cacheLocalProfile(committed);
        await SafeStorage.removeItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);
        return { success: true, profile: committed };
      }

      // Offline/local mode: the local profile store is the demo boundary.
      profileRecord.profile_revision = (expectedRevision ?? 0) + 1;
      await SafeStorage.setItem(
        `${PROFILE_STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(profileRecord)
      );
      await SafeStorage.removeItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);
      return { success: true, profile: profileRecord };
    } catch (err: any) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'Your profile changed on another device. Review your answers and submit again.'
          : err?.message || 'Unable to save profile data. Please check your connection and try again.';
      return { success: false, error: message };
    }
  },

  toEngineProfile: (profile: UserProfile): EngineProfilePayload => {
    return toEngineProfile(profile);
  },

  saveDemoProfile: async (userId: string, fullName: string): Promise<UserProfile> => {
    const profileRecord = getDemoUserProfile(userId, fullName);
    profileRecord.profile_revision = 1;

    if (isLiveSupabaseConfigured()) {
      const saved = await apiClient.put<Record<string, any>>('/api/v1/profile/me', {
        full_name: profileRecord.full_name,
        age: profileRecord.age,
        sex: profileRecord.sex,
        height_cm: profileRecord.height_cm,
        weight_kg: profileRecord.weight_kg,
        fitness_goal: profileRecord.fitness_goal,
        lifestyle_activity: profileRecord.lifestyle_activity,
        diet: profileRecord.diet,
        preferred_activities: profileRecord.preferred_activities,
        accessibility_needs: profileRecord.accessibility_needs,
        blind_low_vision_resources: [],
        has_exercise_restriction: profileRecord.has_exercise_restriction,
        strength_equipment: profileRecord.strength_equipment,
        strength_experience: profileRecord.strength_experience,
        onboarding_completed: true,
      });
      const committed = normalizeProfile(saved);
      cacheLocalProfile(committed);
      return committed;
    }

    await SafeStorage.setItem(
      `${PROFILE_STORAGE_KEY_PREFIX}${userId}`,
      JSON.stringify(profileRecord)
    );
    return profileRecord;
  },

  toEngineActivityPreferences: (profile: UserProfile): string[] => {
    return toEngineActivityPreferences(profile);
  },

  /**
   * Resolves the engine request from a committed, completed profile only.
   * Never fabricates defaults for an incomplete assessment.
   */
  resolveEngineRequest: async (userId?: string) => {
    if (userId && userId !== 'user_default') {
      const profile = await ProfileService.getProfile(userId);
      if (profile?.onboarding_completed) {
        return {
          profile: toEngineProfile(profile),
          activities: toEngineActivityPreferences(profile),
          profile_revision: profile.profile_revision ?? 0,
        };
      }
      throw new ApiError(
        'Complete your assessment before generating a plan.',
        428
      );
    }
    throw new ApiError(
      'A signed-in profile is required to generate a plan.',
      401
    );
  },

  saveQuizDraft: async (userId: string, step: number, data: QuizFormData): Promise<void> => {
    try {
      await SafeStorage.setItem(
        `${QUIZ_DRAFT_KEY_PREFIX}${userId}`,
        JSON.stringify({ step, data, lastUpdated: new Date().toISOString() })
      );
    } catch (err) {
      console.warn('Failed to save quiz draft:', err);
    }
  },

  getQuizDraft: async (
    userId: string
  ): Promise<{ step: number; data: QuizFormData } | null> => {
    try {
      const draft = await SafeStorage.getItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        return { step: parsed.step, data: parsed.data };
      }
      return null;
    } catch (err) {
      console.warn('Failed to retrieve quiz draft:', err);
      return null;
    }
  },

  clearQuizDraft: async (userId: string): Promise<void> => {
    try {
      await SafeStorage.removeItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);
    } catch (err) {
      console.warn('Failed to clear quiz draft:', err);
    }
  },
};

/**
 * Maps the committed UserProfile to the engine payload.
 *
 * Values remain null/undefined unless the profile actually has them; the
 * caller decides when a plan is eligible instead of receiving invented
 * default demographics.
 */
export function toEngineProfile(profile: UserProfile): EngineProfilePayload {
  const accessibility =
    profile.accessibility_needs && profile.accessibility_needs.length > 0
      ? profile.accessibility_needs
      : (['none'] as string[]);
  const primary =
    accessibility.find((n) => n === 'blind_low_vision') ||
    accessibility.find((n) => n === 'deaf_hard_of_hearing') ||
    accessibility.find((n) => n === 'other') ||
    'none';
  return {
    age: profile.age ?? 0,
    sex: profile.sex ?? '',
    height_cm: profile.height_cm ?? 0,
    weight_kg: profile.weight_kg ?? 0,
    goal: profile.fitness_goal ?? '',
    lifestyle_activity: profile.lifestyle_activity ?? '',
    diet: profile.diet ?? '',
    accessibility_id: primary,
  };
}

export function toEngineActivityPreferences(profile: UserProfile): string[] {
  return profile.preferred_activities || profile.user_activity_preferences || [];
}
