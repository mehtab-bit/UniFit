/**
 * Authenticated meal-log API client.
 */

import { apiClient } from './apiClient';
import { MealLogEntry } from '../../types/domain';

export interface MealLogCreateInput {
  local_date: string;
  meal_type?: string | null;
  source: 'planned_meal' | 'food' | 'custom';
  plan_meal_id?: string | null;
  food_code?: string | null;
  custom_name?: string | null;
  quantity: number;
  quantity_unit?: 'serving' | 'gram' | 'piece';
  nutrition: {
    calories_kcal?: number | null;
    protein_g?: number | null;
    carbohydrates_g?: number | null;
    fat_g?: number | null;
    fibre_g?: number | null;
    carbohydrate_complete?: boolean;
    fiber_complete?: boolean;
  };
  notes?: string | null;
}

function mapEntry(row: Record<string, any>): MealLogEntry {
  return {
    id: row.id,
    user_id: row.user_id,
    local_date: row.local_date,
    meal_type: row.meal_type,
    source: row.source,
    plan_meal_id: row.plan_meal_id,
    food_code: row.food_code,
    custom_name: row.custom_name,
    quantity: Number(row.quantity || 0),
    quantity_unit: row.quantity_unit || 'serving',
    nutrition: {
      calories_kcal:
        row.nutrition?.calories_kcal != null
          ? Number(row.nutrition.calories_kcal)
          : null,
      protein_g:
        row.nutrition?.protein_g != null ? Number(row.nutrition.protein_g) : null,
      carbohydrates_g:
        row.nutrition?.carbohydrates_g != null
          ? Number(row.nutrition.carbohydrates_g)
          : null,
      fat_g: row.nutrition?.fat_g != null ? Number(row.nutrition.fat_g) : null,
      fibre_g:
        row.nutrition?.fibre_g != null ? Number(row.nutrition.fibre_g) : null,
      carbohydrate_complete: Boolean(row.nutrition?.carbohydrate_complete),
      fiber_complete: Boolean(row.nutrition?.fiber_complete),
    },
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MealLogApiService {
  async list(localDate?: string): Promise<MealLogEntry[]> {
    const suffix = localDate ? `?local_date=${encodeURIComponent(localDate)}` : '';
    const rows = await apiClient.get<Record<string, any>[]>(
      `/api/v1/meals/logs${suffix}`
    );
    return (rows || []).map(mapEntry);
  }

  async create(input: MealLogCreateInput): Promise<MealLogEntry> {
    const row = await apiClient.post<Record<string, any>>(
      '/api/v1/meals/logs',
      {
        local_date: input.local_date,
        meal_type: input.meal_type || null,
        source: input.source,
        plan_meal_id: input.plan_meal_id || null,
        food_code: input.food_code || null,
        custom_name: input.custom_name || null,
        quantity: input.quantity,
        quantity_unit: input.quantity_unit || 'serving',
        nutrition: {
          calories_kcal: input.nutrition.calories_kcal ?? null,
          protein_g: input.nutrition.protein_g ?? null,
          carbohydrates_g: input.nutrition.carbohydrates_g ?? null,
          fat_g: input.nutrition.fat_g ?? null,
          fibre_g: input.nutrition.fibre_g ?? null,
          carbohydrate_complete:
            input.nutrition.carbohydrate_complete ?? false,
          fiber_complete: input.nutrition.fiber_complete ?? false,
        },
        notes: input.notes || null,
      }
    );
    return mapEntry(row);
  }

  async remove(entryId: string): Promise<void> {
    await apiClient.delete(`/api/v1/meals/logs/${entryId}`);
  }
}

export const mealLogApiService = new MealLogApiService();
