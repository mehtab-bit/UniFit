/**
 * UniFit Service Layer Registry.
 * Exports active service singletons consumed across UI screens and hooks.
 * In the future, mock service exports can be swapped with ApiService instances here.
 */

export * from './types';

// Mock Service Implementations
import { mockWorkoutService } from './mock/workoutMock';
import { mockNutritionService } from './mock/nutritionMock';
import { mockMealService } from './mock/mealMock';
import { mockActivityService } from './mock/activityMock';
import { mockStreakService } from './mock/streakMock';
import { mockCVService } from './mock/cvMock';
import { mockProgressService } from './mock/progressMock';

// Active Services (currently Mock, ready for API swap)
export const workoutService = mockWorkoutService;
export const nutritionService = mockNutritionService;
export const mealService = mockMealService;
export const activityService = mockActivityService;
export const streakService = mockStreakService;
export const cvService = mockCVService;
export const progressService = mockProgressService;
