import {
  WorkoutPlan,
  WorkoutDay,
  NutritionTargets,
  MealPlan,
  ActivitySession,
  ActivitySummary,
  StreakData,
  CalendarDay,
  CVFeedback,
  Exercise,
  ProgressSummary,
  WorkoutCompletionPayload,
} from '../types/domain';

export interface IWorkoutService {
  getWeeklyPlan(userId?: string): Promise<WorkoutPlan>;
  getWeeklyWorkoutPlan(userId?: string): Promise<WorkoutPlan>;
  getTodayWorkout(userId?: string): Promise<WorkoutDay>;
  getTomorrowWorkout(userId?: string): Promise<WorkoutDay>;
  getUpcomingWorkouts(userId?: string): Promise<WorkoutDay[]>;
  getWorkoutByDate(date: string, userId?: string): Promise<WorkoutDay | null>;
  logWorkoutCompletion(
    payloadOrId: string | WorkoutCompletionPayload,
    durationMinutes?: number,
    repsCompleted?: number
  ): Promise<{ success: boolean; completedAt: string }>;
}

export interface INutritionService {
  getDailyTargets(userId?: string, date?: string): Promise<NutritionTargets>;
  getDailyNutritionTargets(userId?: string, date?: string): Promise<NutritionTargets>;
  getWeeklyNutritionTargets(userId?: string): Promise<NutritionTargets[]>;
}

export interface IMealService {
  getDailyMealPlan(userId?: string, date?: string): Promise<MealPlan>;
  getWeeklyMealPlan(userId?: string): Promise<MealPlan[]>;
  getMealByDate(date: string, userId?: string): Promise<MealPlan | null>;
}

export interface IActivityService {
  getRecentSessions(userId?: string): Promise<ActivitySession[]>;
  getWeeklySummary(userId?: string): Promise<ActivitySummary>;
}

export interface IStreakService {
  getStreakData(userId?: string): Promise<StreakData>;
  getMonthlyCalendar(year: number, monthIndex: number, userId?: string): Promise<CalendarDay[]>;
}

export interface ICVService {
  getFeedback(exerciseName: string, currentReps: number): Promise<CVFeedback>;
  getExerciseLibrary(): Promise<Exercise[]>;
}

export interface IProgressService {
  getProgressSummary(userId?: string): Promise<ProgressSummary>;
  getProgress(userId?: string): Promise<ProgressSummary>;
}

export type { WorkoutNote, IWorkoutNoteService } from './workoutNoteService';
