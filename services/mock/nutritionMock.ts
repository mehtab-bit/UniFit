import { INutritionService } from '../types';
import { NutritionTargets } from '../../types/domain';

const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  calories: 2400,
  consumedCalories: 1940,
  remainingCalories: 460,
  proteinG: 145,
  carbsG: 210,
  carbohydratesG: 210,
  fatG: 58,
  fibreG: 28,
  waterMl: 2800,
};

export class MockNutritionService implements INutritionService {
  async getDailyTargets(_userId?: string, _date?: string): Promise<NutritionTargets> {
    return { ...DEFAULT_NUTRITION_TARGETS };
  }

  async getDailyNutritionTargets(userId?: string, date?: string): Promise<NutritionTargets> {
    return this.getDailyTargets(userId, date);
  }

  async getWeeklyNutritionTargets(_userId?: string): Promise<NutritionTargets[]> {
    return [
      { ...DEFAULT_NUTRITION_TARGETS },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 2100, remainingCalories: 300 },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 1850, remainingCalories: 550 },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 2200, remainingCalories: 200 },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 1950, remainingCalories: 450 },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 2350, remainingCalories: 50 },
      { ...DEFAULT_NUTRITION_TARGETS, consumedCalories: 1940, remainingCalories: 460 },
    ];
  }
}

export const mockNutritionService = new MockNutritionService();
