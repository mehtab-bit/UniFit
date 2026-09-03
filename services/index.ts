/**
 * UniFit Service Layer Registry.
 *
 * Exports active service singletons consumed across UI screens and hooks.
 * Active services point to the FastAPI backend with seamless graceful fallback
 * to local mock services when the backend is offline.
 * Mock services remain fully available for isolated testing.
 */

export * from './types';

// Mock Services (Available for testing / offline demo)
export { mockWorkoutService } from './mock/workoutMock';
export { mockNutritionService } from './mock/nutritionMock';
export { mockMealService } from './mock/mealMock';
export { mockActivityService } from './mock/activityMock';
export { mockStreakService } from './mock/streakMock';
export { mockCVService } from './mock/cvMock';
export { mockProgressService } from './mock/progressMock';

// API Services
import { workoutApiService } from './api/workoutApi';
import { nutritionApiService } from './api/nutritionApi';
import { mealApiService } from './api/mealApi';
import { activityApiService } from './api/activityApi';
import { streakApiService } from './api/streakApi';
import { progressApiService } from './api/progressApi';
import { mockCVService } from './mock/cvMock';

import { workoutNoteService } from './workoutNoteService';
export { workoutNoteService } from './workoutNoteService';

// Active Services Swapped to API implementations
export const workoutService = workoutApiService;
export const nutritionService = nutritionApiService;
export const mealService = mealApiService;
export const activityService = activityApiService;
export const streakService = streakApiService;
export const cvService = mockCVService; // CV service boundary preserved as requested
export const progressService = progressApiService;
