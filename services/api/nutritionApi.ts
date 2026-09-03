/**
 * API-backed implementation of INutritionService.
 * Consumes engine-calculated nutrition targets from the FastAPI backend.
 */

import { INutritionService } from '../types';
import { NutritionTargets } from '../../types/domain';
import { apiClient } from './apiClient';
import { mockNutritionService } from '../mock/nutritionMock';
import { DEMO_ENGINE_PROFILE, DEMO_ENGINE_ACTIVITIES } from '../../constants/demo';

function mapBackendNutritionToTargets(nutrition: any): NutritionTargets {
  const calories = Math.round(nutrition.target_kcal || nutrition.calories || 2400);
  const protein = Math.round(nutrition.protein_target_g || nutrition.proteinG || 145);
  const carbs = nutrition.carbohydrate_target_g !== undefined && nutrition.carbohydrate_target_g !== null
    ? Math.round(nutrition.carbohydrate_target_g)
    : (nutrition.carbsG !== undefined ? nutrition.carbsG : 210);
  const fat = Math.round(nutrition.fat_target_g || nutrition.fatG || 58);
  const fibre = nutrition.fiber_target_g !== undefined && nutrition.fiber_target_g !== null
    ? Math.round(nutrition.fiber_target_g)
    : (nutrition.fibreG !== undefined ? nutrition.fibreG : 28);

  const consumed = 1940;
  const remaining = Math.max(0, calories - consumed);

  return {
    calories,
    proteinG: protein,
    carbsG: carbs,
    carbohydratesG: carbs,
    fatG: fat,
    fibreG: fibre,
    consumedCalories: consumed,
    remainingCalories: remaining,
    waterMl: 2500,
  };
}

export class NutritionApiService implements INutritionService {
  async getDailyTargets(userId: string = 'user_default', date?: string): Promise<NutritionTargets> {
    try {
      const todayStr = date || new Date().toISOString().split('T')[0];
      const response: any = await apiClient.get(`/api/v1/nutrition/${todayStr}?user_id=${userId}`);
      return mapBackendNutritionToTargets(response);
    } catch (err) {
      console.warn('[NutritionApiService] Falling back to mock nutrition:', err);
      return mockNutritionService.getDailyTargets(userId, date);
    }
  }

  async getDailyNutritionTargets(userId?: string, date?: string): Promise<NutritionTargets> {
    return this.getDailyTargets(userId, date);
  }

  async getWeeklyNutritionTargets(userId: string = 'user_default'): Promise<NutritionTargets[]> {
    try {
      const response: any = await apiClient.post('/api/v1/nutrition/weekly', {
        user_id: userId,
        week_number: 1,
        profile: DEMO_ENGINE_PROFILE,
        activity_preferences: DEMO_ENGINE_ACTIVITIES,
      });

      return (response.days || []).map((d: any) => mapBackendNutritionToTargets(d.nutrition));
    } catch {
      return mockNutritionService.getWeeklyNutritionTargets(userId);
    }
  }
}

export const nutritionApiService = new NutritionApiService();
