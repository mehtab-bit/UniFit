/**
 * API-backed implementation of INutritionService.
 * Consumes engine-calculated nutrition targets from the FastAPI backend.
 */

import { INutritionService } from '../types';
import { NutritionTargets } from '../../types/domain';
import { fetchCombinedWeek, pickDayFromWeek } from './combinedPlan';

function mapBackendNutritionToTargets(nutrition: any): NutritionTargets {
  const calories = Math.round(nutrition.target_kcal || nutrition.calories || 0);
  const protein = Math.round(nutrition.protein_target_g || nutrition.proteinG || 0);
  const carbs = nutrition.carbohydrate_target_g !== undefined && nutrition.carbohydrate_target_g !== null
    ? Math.round(nutrition.carbohydrate_target_g)
    : (nutrition.carbsG !== undefined ? nutrition.carbsG : 0);
  const fat = Math.round(nutrition.fat_target_g || nutrition.fatG || 0);
  const fibre = nutrition.fiber_target_g !== undefined && nutrition.fiber_target_g !== null
    ? Math.round(nutrition.fiber_target_g)
    : (nutrition.fibreG !== undefined ? nutrition.fibreG : 0);

  // No meal-logging feature exists yet, so nothing is "consumed" by default.
  const consumed = 0;
  const remaining = Math.max(0, calories - consumed);

  return {
    calories,
    proteinG: protein,
    carbsG: carbs,
    carbohydratesG: carbs,
    fatG: fat,
    fibreG: fibre,
    consumedCalories: 0,
    remainingCalories: remaining,
    waterMl: 2500,
  };
}

export class NutritionApiService implements INutritionService {
  async getDailyTargets(userId: string = 'user_default', date?: string): Promise<NutritionTargets> {
    const response: any = await fetchCombinedWeek(userId);
    const day = pickDayFromWeek(response.nutrition, date);
    return mapBackendNutritionToTargets(day?.nutrition || day || {});
  }

  async getDailyNutritionTargets(userId?: string, date?: string): Promise<NutritionTargets> {
    return this.getDailyTargets(userId, date);
  }

  async getWeeklyNutritionTargets(userId: string = 'user_default'): Promise<NutritionTargets[]> {
    const response: any = await fetchCombinedWeek(userId);
    return (response.nutrition || []).map((d: any) =>
      mapBackendNutritionToTargets(d.nutrition || d)
    );
  }
}

export const nutritionApiService = new NutritionApiService();
