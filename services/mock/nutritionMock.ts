import { INutritionService } from '../types';
import { NutritionTargets } from '../../types/domain';
import { ProfileService } from '../../lib/profile';
import { UserProfile } from '../../types/quiz';

const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  calories: 0,
  consumedCalories: 0,
  remainingCalories: 0,
  proteinG: 0,
  carbsG: 0,
  carbohydratesG: 0,
  fatG: 0,
  fibreG: 0,
  waterMl: 0,
};

/**
 * Estimates a day's nutrition targets from the user's real onboarding profile
 * (Mifflin-St Jeor BMR x activity factor x goal adjustment). Offline stand-in
 * for the backend engine's exact calculations.
 */
function targetsFromProfile(profile: UserProfile | null): NutritionTargets {
  if (!profile) return { ...DEFAULT_NUTRITION_TARGETS };

  const age = profile.age ?? 28;
  const sex = profile.sex ?? 'male';
  const heightCm = profile.height_cm ?? 170;
  const weightKg = profile.weight_kg ?? 70;

  // Mifflin-St Jeor
  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'female' ? -161 : 5);

  const activityFactor: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };
  const goalAdjustment: Record<string, number> = {
    lose_fat: 0.82,
    maintain: 1.0,
    muscle_gain: 1.12,
  };

  const calories = Math.round(
    bmr * (activityFactor[profile.lifestyle_activity ?? 'light'] ?? 1.375) *
      (goalAdjustment[profile.fitness_goal ?? 'maintain'] ?? 1.0)
  );
  const proteinG = Math.round((1.8 * weightKg) / 10) * 10;
  const fatG = Math.round((calories * 0.27) / 9);
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  return {
    calories,
    consumedCalories: 0,
    remainingCalories: calories,
    proteinG,
    carbsG,
    carbohydratesG: carbsG,
    fatG,
    fibreG: Math.round(weightKg * 0.4),
    waterMl: Math.round(weightKg * 35),
  };
}

export class MockNutritionService implements INutritionService {
  async getDailyTargets(userId?: string, _date?: string): Promise<NutritionTargets> {
    const profile = await this.resolveProfile(userId);
    return targetsFromProfile(profile);
  }

  async getDailyNutritionTargets(userId?: string, date?: string): Promise<NutritionTargets> {
    return this.getDailyTargets(userId, date);
  }

  async getWeeklyNutritionTargets(userId?: string): Promise<NutritionTargets[]> {
    const base = await this.getDailyTargets(userId);
    return [
      { ...base },
      { ...base, consumedCalories: 0, remainingCalories: base.calories },
      { ...base },
      { ...base, consumedCalories: 0, remainingCalories: base.calories },
      { ...base },
      { ...base },
      { ...base, consumedCalories: 0, remainingCalories: base.calories },
    ];
  }

  private async resolveProfile(userId?: string): Promise<UserProfile | null> {
    if (!userId || userId === 'user_default') return null;
    try {
      return await ProfileService.getProfile(userId);
    } catch {
      return null;
    }
  }
}

export const mockNutritionService = new MockNutritionService();
