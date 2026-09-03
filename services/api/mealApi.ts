/**
 * API-backed implementation of IMealService.
 * Consumes portion-scaled meal plans from the FastAPI backend.
 */

import { IMealService } from '../types';
import { MealPlan, Meal, MealType, ScaledIngredient, NutritionTargets } from '../../types/domain';
import { mockMealService } from '../mock/mealMock';
import { fetchCombinedWeek, pickDayFromWeek } from './combinedPlan';

function mapMealTimeToType(type: string): string {
  switch (type.toLowerCase()) {
    case 'breakfast':
      return '8:00 AM';
    case 'lunch':
      return '1:00 PM';
    case 'evening_snack':
    case 'snack':
      return '5:00 PM';
    case 'dinner':
      return '8:00 PM';
    default:
      return '12:00 PM';
  }
}

function mapMealIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'breakfast':
      return 'sun';
    case 'lunch':
      return 'coffee';
    case 'evening_snack':
    case 'snack':
      return 'zap';
    case 'dinner':
    default:
      return 'moon';
  }
}

function mapBackendMealDay(dayData: any, dateStr: string): MealPlan {
  const rawMeals = dayData.meals || [];
  const target = dayData.target || {};

  const targets: NutritionTargets = {
    calories: Math.round(target.target_kcal || 2400),
    proteinG: Math.round(target.protein_target_g || 145),
    carbsG: target.carbohydrate_target_g ? Math.round(target.carbohydrate_target_g) : null,
    carbohydratesG: target.carbohydrate_target_g ? Math.round(target.carbohydrate_target_g) : null,
    fatG: Math.round(target.fat_target_g || 58),
    fibreG: target.fiber_target_g ? Math.round(target.fiber_target_g) : null,
    consumedCalories: 1940,
    remainingCalories: 460,
  };

  const meals: Meal[] = rawMeals.map((m: any, idx: number) => {
    const mealType = (m.meal_type || 'lunch') as MealType;
    const calories = Math.round(m.kcal || m.calories || 500);
    const protein = Math.round(m.protein_g || 30);
    const carbs = m.known_carbohydrate_g !== undefined ? Math.round(m.known_carbohydrate_g) : null;
    const fat = Math.round(m.fat_g || 15);
    const fibre = m.known_fiber_g !== undefined ? Math.round(m.known_fiber_g) : null;

    const scaledIngredients: ScaledIngredient[] = (m.scaled_ingredient_quantities || []).map((i: any) => ({
      name: i.name || i.food_name || 'Ingredient',
      amount: i.amount || `${i.quantity_g}g`,
    }));

    const ingredientsList = scaledIngredients.length > 0
      ? scaledIngredients.map((i) => `${i.name} (${i.amount})`)
      : (m.ingredients || []).map((i: any) => typeof i === 'string' ? i : `${i.food_name} (${i.quantity_g}g)`);

    return {
      id: m.meal_id || `meal-${idx}`,
      mealType,
      title: m.meal_name || m.title || 'Meal',
      time: mapMealTimeToType(mealType),
      servingLabel: m.portion_label || `${m.portion_multiplier || 1} servings`,
      servings: m.portion_multiplier || 1,
      calories,
      caloriesFormatted: `${calories} kcal`,
      proteinG: protein,
      carbsG: carbs,
      carbohydratesG: carbs,
      fatG: fat,
      fibreG: fibre,
      nutrition: {
        calories,
        proteinG: protein,
        carbohydratesG: carbs,
        fatG: fat,
        fibreG: fibre,
      },
      items: ingredientsList.join(', '),
      ingredients: ingredientsList,
      scaledIngredientQuantities: scaledIngredients,
      preparationNote: m.prep_note || 'Prepare according to standard recipe instructions.',
      prepNote: m.prep_note,
      icon: mapMealIcon(mealType),
    };
  });

  return {
    id: `meal_plan_${dayData.day || 'today'}`,
    date: dateStr,
    targets,
    meals,
  };
}

export class MealApiService implements IMealService {
  async getDailyMealPlan(userId: string = 'user_default', date?: string): Promise<MealPlan> {
    try {
      const todayStr = date || new Date().toISOString().split('T')[0];
      const response: any = await fetchCombinedWeek(userId);
      const day = pickDayFromWeek(response.meals, date);
      return mapBackendMealDay(day || {}, todayStr);
    } catch (err) {
      console.warn('[MealApiService] Falling back to mock meals:', err);
      return mockMealService.getDailyMealPlan(userId, date);
    }
  }

  async getWeeklyMealPlan(userId: string = 'user_default'): Promise<MealPlan[]> {
    try {
      const response: any = await fetchCombinedWeek(userId);

      const today = new Date();
      return (response.meals || []).map((day: any, idx: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() + idx);
        return mapBackendMealDay(day, d.toISOString().split('T')[0]);
      });
    } catch {
      return mockMealService.getWeeklyMealPlan(userId);
    }
  }

  async getMealByDate(date: string, userId?: string): Promise<MealPlan | null> {
    return this.getDailyMealPlan(userId, date);
  }
}

export const mealApiService = new MealApiService();
