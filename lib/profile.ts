import { supabase, isLiveSupabaseConfigured, SafeStorage } from './supabase';
import { UserProfile, QuizFormData, EngineProfilePayload } from '../types/quiz';
import { getDemoUserProfile } from '../constants/demo';

const PROFILE_STORAGE_KEY_PREFIX = '@unifit_user_profile_';
const QUIZ_DRAFT_KEY_PREFIX = '@unifit_quiz_draft_';

export const ProfileService = {
  /**
   * Fetches user profile from Supabase with local fallback
   */
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          const profile: UserProfile = {
            id: data.id,
            user_id: data.user_id,
            full_name: data.full_name || 'UniFit Athlete',
            age: data.age,
            sex: data.sex,
            height_cm: data.height_cm ? Number(data.height_cm) : null,
            weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
            fitness_goal: data.fitness_goal,
            lifestyle_activity: data.lifestyle_activity,
            preferred_activities: data.preferred_activities || data.user_activity_preferences || [],
            user_activity_preferences: data.preferred_activities || data.user_activity_preferences || [],
            diet: data.diet,
            accessibility_needs: data.accessibility_needs || [],
            accessibility_other_details: data.accessibility_other_details,
            blind_low_vision_resources: data.blind_low_vision_resources || [],
            has_exercise_restriction: data.has_exercise_restriction,
            exercise_restriction_description: data.exercise_restriction_description,
            strength_equipment: data.strength_equipment || [],
            strength_equipment_other: data.strength_equipment_other,
            strength_experience: data.strength_experience,
            onboarding_completed: Boolean(data.onboarding_completed),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };

          // Cache locally
          await SafeStorage.setItem(
            `${PROFILE_STORAGE_KEY_PREFIX}${userId}`,
            JSON.stringify(profile)
          );

          return profile;
        }
      }

      // Check local fallback
      const cached = await SafeStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${userId}`);
      if (cached) {
        return JSON.parse(cached) as UserProfile;
      }

      return null;
    } catch (err) {
      console.warn('Profile fetch error:', err);
      const cached = await SafeStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${userId}`);
      return cached ? JSON.parse(cached) : null;
    }
  },

  /**
   * Saves the complete quiz answers and marks onboarding as completed
   */
  saveQuizProfile: async (
    userId: string,
    fullName: string,
    quizData: QuizFormData
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    try {
      const parsedAge = parseInt(quizData.age, 10);
      const parsedHeight = parseFloat(quizData.height_cm);
      const parsedWeight = parseFloat(quizData.weight_kg);

      const profileRecord: UserProfile = {
        user_id: userId,
        full_name: fullName,
        age: !isNaN(parsedAge) && parsedAge >= 18 ? parsedAge : null,
        sex: quizData.sex || null,
        height_cm: !isNaN(parsedHeight) ? parsedHeight : null,
        weight_kg: !isNaN(parsedWeight) ? parsedWeight : null,
        fitness_goal: quizData.fitness_goal || null,
        lifestyle_activity: quizData.lifestyle_activity || null,
        preferred_activities: quizData.user_activity_preferences || [],
        user_activity_preferences: quizData.user_activity_preferences || [],
        diet: quizData.diet || null,
        accessibility_needs: quizData.accessibility_needs.length > 0 ? quizData.accessibility_needs : ['none'],
        accessibility_other_details: quizData.accessibility_other_details.trim() || undefined,
        blind_low_vision_resources: quizData.blind_low_vision_resources || [],
        has_exercise_restriction: quizData.has_exercise_restriction !== null ? quizData.has_exercise_restriction : false,
        exercise_restriction_description: quizData.exercise_restriction_description.trim() || undefined,
        strength_equipment: quizData.strength_equipment.length > 0 ? quizData.strength_equipment : ['no_equipment'],
        strength_equipment_other: quizData.strength_equipment_other.trim() || undefined,
        strength_experience: quizData.strength_experience || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabaseConfigured()) {
        // Upsert into Supabase profiles table
        const { data, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            full_name: fullName,
            age: profileRecord.age,
            sex: profileRecord.sex,
            height_cm: profileRecord.height_cm,
            weight_kg: profileRecord.weight_kg,
            fitness_goal: profileRecord.fitness_goal,
            lifestyle_activity: profileRecord.lifestyle_activity,
            diet: profileRecord.diet,
            accessibility_needs: profileRecord.accessibility_needs,
            accessibility_other_details: profileRecord.accessibility_other_details,
            blind_low_vision_resources: profileRecord.blind_low_vision_resources,
            has_exercise_restriction: profileRecord.has_exercise_restriction,
            exercise_restriction_description: profileRecord.exercise_restriction_description,
            strength_equipment: profileRecord.strength_equipment,
            strength_equipment_other: profileRecord.strength_equipment_other,
            strength_experience: profileRecord.strength_experience,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (profileError) {
          console.warn('Supabase profile upsert error:', profileError);
        }

        // Sync user activity preferences
        if (quizData.user_activity_preferences.length > 0) {
          await supabase
            .from('user_activity_preferences')
            .delete()
            .eq('user_id', userId);

          const activityRows = quizData.user_activity_preferences.map((act) => ({
            user_id: userId,
            activity: act,
          }));

          await supabase.from('user_activity_preferences').insert(activityRows);
        }

        if (data) {
          profileRecord.id = data.id;
        }
      }

      // Save locally to cache & mark onboarding flag
      await SafeStorage.setItem(
        `${PROFILE_STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(profileRecord)
      );

      // Clear quiz draft after successful submission
      await SafeStorage.removeItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);

      return { success: true, profile: profileRecord };
    } catch (err: any) {
      console.warn('Failed to save quiz profile:', err);
      return {
        success: false,
        error: 'Unable to save profile data. Please check your connection and try again.',
      };
    }
  },

  /**
   * Authoritative Engine Profile Mapper (Section 2).
   * Transforms frontend UserProfile into the exact engine profile object:
   * { age, sex, height_cm, weight_kg, goal, lifestyle_activity, diet, accessibility_id }
   * Activity preferences remain separate.
   */
  toEngineProfile: (profile: UserProfile): EngineProfilePayload => {
    return toEngineProfile(profile);
  },

  /**
   * Creates/refreshes the one-tap demo profile and marks onboarding complete.
   */
  saveDemoProfile: async (userId: string, fullName: string): Promise<UserProfile> => {
    const profileRecord = getDemoUserProfile(userId, fullName);

    if (isLiveSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            full_name: profileRecord.full_name,
            age: profileRecord.age,
            sex: profileRecord.sex,
            height_cm: profileRecord.height_cm,
            weight_kg: profileRecord.weight_kg,
            fitness_goal: profileRecord.fitness_goal,
            lifestyle_activity: profileRecord.lifestyle_activity,
            diet: profileRecord.diet,
            accessibility_needs: profileRecord.accessibility_needs,
            has_exercise_restriction: profileRecord.has_exercise_restriction,
            strength_equipment: profileRecord.strength_equipment,
            strength_experience: profileRecord.strength_experience,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (data) {
        profileRecord.id = data.id;
      } else {
        console.warn('Demo profile upsert error:', error);
      }

      await supabase
        .from('user_activity_preferences')
        .delete()
        .eq('user_id', userId);
      await supabase.from('user_activity_preferences').insert(
        profileRecord.preferred_activities.map((activity) => ({
          user_id: userId,
          activity
        }))
      );
    }

    await SafeStorage.setItem(
      `${PROFILE_STORAGE_KEY_PREFIX}${userId}`,
      JSON.stringify(profileRecord)
    );

    return profileRecord;
  },

  /**
   * Extracts activity preferences separately per engine contract.
   */
  toEngineActivityPreferences: (profile: UserProfile): string[] => {
    return toEngineActivityPreferences(profile);
  },

  /**
   * Transforms the normalized frontend UserProfile into the backend Python fitness-engine request payload.
   * Ready for direct FastAPI POST /api/v1/plans/generate integration.
   */
  toEngineRequestPayload: (profile: UserProfile) => {
    return {
      user_id: profile.user_id,
      age: profile.age ?? 28,
      sex: profile.sex ?? 'male',
      height_cm: profile.height_cm ?? 175,
      weight_kg: profile.weight_kg ?? 70,
      fitness_goal: profile.fitness_goal ?? 'lose_fat',
      lifestyle_activity: profile.lifestyle_activity ?? 'sedentary',
      preferred_activities: profile.preferred_activities || profile.user_activity_preferences || ['walking'],
      diet: profile.diet ?? 'non_vegetarian',
      accessibility_needs: profile.accessibility_needs || ['none'],
      accessibility_resources: profile.blind_low_vision_resources || [],
      has_exercise_restriction: Boolean(profile.has_exercise_restriction),
      exercise_restriction_description: profile.exercise_restriction_description ?? '',
      strength_equipment: profile.strength_equipment || ['no_equipment'],
      strength_experience: profile.strength_experience ?? 'new',
    };
  },

  /**
   * Resolves the engine request (profile + activity preferences) for a logged-in user.
   * Loads the user's real onboarding profile when available; falls back to the
   * demo defaults for not-yet-onboarded users and unknown ids so screens still render.
   */
  resolveEngineRequest: async (userId?: string) => {
    const demoProfile = getDemoUserProfile(userId || 'demo');

    if (userId && userId !== 'user_default') {
      try {
        const profile = await ProfileService.getProfile(userId);
        if (profile?.onboarding_completed) {
          const payload = ProfileService.toEngineRequestPayload(profile);
          return {
            profile: {
              age: payload.age,
              sex: payload.sex,
              height_cm: payload.height_cm,
              weight_kg: payload.weight_kg,
              goal: payload.fitness_goal,
              lifestyle_activity: payload.lifestyle_activity,
              diet: payload.diet,
              accessibility_id:
                profile.accessibility_needs && profile.accessibility_needs.length > 0
                  ? profile.accessibility_needs[0]
                  : 'none',
            },
            activities:
              profile.preferred_activities && profile.preferred_activities.length > 0
                ? profile.preferred_activities
                : demoProfile.preferred_activities,
          };
        }
      } catch (err) {
        console.warn('[ProfileService] Engine request resolve failed, using demo defaults:', err);
      }
    }

    return {
      profile: {
        age: demoProfile.age ?? 28,
        sex: demoProfile.sex ?? 'male',
        height_cm: demoProfile.height_cm ?? 175,
        weight_kg: demoProfile.weight_kg ?? 70,
        goal: demoProfile.fitness_goal ?? 'lose_fat',
        lifestyle_activity: demoProfile.lifestyle_activity ?? 'sedentary',
        diet: demoProfile.diet ?? 'non_vegetarian',
        accessibility_id: 'none',
      },
      activities: demoProfile.preferred_activities,
    };
  },

  /**
   * Saves temporary quiz draft so user progress is never lost on interruption
   */
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

  /**
   * Retrieves saved quiz draft if available
   */
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

  /**
   * Clears quiz draft
   */
  clearQuizDraft: async (userId: string): Promise<void> => {
    try {
      await SafeStorage.removeItem(`${QUIZ_DRAFT_KEY_PREFIX}${userId}`);
    } catch (err) {
      console.warn('Failed to clear quiz draft:', err);
    }
  },
};

/**
 * Authoritative Engine Profile Mapper (Section 2).
 * Transforms frontend UserProfile into the exact engine profile object:
 * {
 *   age,
 *   sex,
 *   height_cm,
 *   weight_kg,
 *   goal,
 *   lifestyle_activity,
 *   diet,
 *   accessibility_id
 * }
 * Note: Activity preferences remain separate per engine specification.
 */
export function toEngineProfile(profile: UserProfile): EngineProfilePayload {
  return {
    age: profile.age ?? 28,
    sex: profile.sex ?? 'male',
    height_cm: profile.height_cm ?? 175,
    weight_kg: profile.weight_kg ?? 70,
    goal: profile.fitness_goal ?? 'lose_fat',
    lifestyle_activity: profile.lifestyle_activity ?? 'sedentary',
    diet: profile.diet ?? 'non_vegetarian',
    accessibility_id:
      profile.accessibility_needs && profile.accessibility_needs.length > 0
        ? profile.accessibility_needs[0]
        : 'none',
  };
}

/**
 * Extracts activity preferences separately per engine contract.
 */
export function toEngineActivityPreferences(profile: UserProfile): string[] {
  return profile.preferred_activities || profile.user_activity_preferences || ['walking'];
}

