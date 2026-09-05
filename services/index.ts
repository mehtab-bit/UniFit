/**
 * UniFit Service Layer Registry.
 *
 * Exports active service singletons consumed across UI screens and hooks.
 * Active services point to the FastAPI backend with graceful fallback to
 * local mock services when the backend is offline.
 */

export * from './types';

// Mock Services (available for isolated/offline testing)
export { mockWorkoutService } from './mock/workoutMock';
export { mockNutritionService } from './mock/nutritionMock';
export { mockMealService } from './mock/mealMock';
export { mockActivityService } from './mock/activityMock';
export { mockStreakService } from './mock/streakMock';
export { mockCVService } from './mock/cvMock';
export { mockProgressService } from './mock/progressMock';

// API-backed services with mock fallback
import { workoutApiService } from './api/workoutApi';
import { nutritionApiService } from './api/nutritionApi';
import { mealApiService } from './api/mealApi';
import { activityApiService } from './api/activityApi';
import { streakApiService } from './api/streakApi';
import { progressApiService } from './api/progressApi';
import { mealLogApiService } from './api/mealLogApi';
import { activityLogApiService } from './api/activityLogApi';
import { mockCVService } from './mock/cvMock';

import { workoutNoteService } from './workoutNoteService';
export { workoutNoteService } from './workoutNoteService';

export const workoutService = workoutApiService;
export const nutritionService = nutritionApiService;
export const mealService = mealApiService;
export const activityService = activityApiService;
export const streakService = streakApiService;
export const cvService = mockCVService; // CV boundary stays mock until live coach is mounted
export const progressService = progressApiService;
export const mealLogService = mealLogApiService;
export const activityLogService = activityLogApiService;
