/**
 * Centralized UniFit Demo Mode Configuration.
 *
 * Provides a single source of truth for the presentation/testing demo account,
 * demo user profile attributes, and engine request defaults.
 *
 * IMPORTANT:
 * - Production builds only enable demo mode when EXPO_PUBLIC_DEMO_MODE === 'true'.
 * - In development (__DEV__), demo mode is enabled by default for developer convenience.
 */

import { UserProfile, EngineProfilePayload } from '../types/quiz';

/**
 * Fixed Demo Account Credentials.
 * Used for one-tap demo authentication during presentations and reviews.
 */
export const DEMO_ACCOUNT = {
  email: 'demo@unifit.app',
  password: 'UniFitDemo@123',
  fullName: 'Demo Athlete',
} as const;

/**
 * Authoritative Demo Profile Attributes.
 * Aligned with the Python fitness engine specifications.
 */
export const DEMO_PROFILE_DATA = {
  age: 22,
  sex: 'male' as const,
  height_cm: 175,
  weight_kg: 70,
  fitness_goal: 'muscle_gain' as const,
  lifestyle_activity: 'light' as const,
  diet: 'vegetarian' as const,
  preferred_activities: ['running', 'cycling'],
  accessibility_needs: ['none'],
  has_exercise_restriction: false,
  strength_equipment: ['household_weights'] as ['household_weights'],
  strength_experience: 'new' as const,
  onboarding_completed: true,
} as const;

/**
 * Authoritative Engine Profile Payload for the Demo User.
 */
export const DEMO_ENGINE_PROFILE: EngineProfilePayload = {
  age: DEMO_PROFILE_DATA.age,
  sex: DEMO_PROFILE_DATA.sex,
  height_cm: DEMO_PROFILE_DATA.height_cm,
  weight_kg: DEMO_PROFILE_DATA.weight_kg,
  goal: DEMO_PROFILE_DATA.fitness_goal,
  lifestyle_activity: DEMO_PROFILE_DATA.lifestyle_activity,
  diet: DEMO_PROFILE_DATA.diet,
  accessibility_id: 'none',
};

/**
 * Authoritative Engine Activity Preferences for the Demo User.
 */
export const DEMO_ENGINE_ACTIVITIES: string[] = ['running', 'cycling'];

/**
 * Environment check to determine if Demo Mode is permitted.
 * Only enabled in development or when explicitly configured via environment flag.
 */
export const isDemoModeEnabled = (): boolean => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEMO_MODE === 'true') {
    return true;
  }
  return typeof __DEV__ !== 'undefined' && __DEV__;
};

/**
 * Helper to construct a complete UserProfile object for the Demo User.
 */
export const getDemoUserProfile = (userId: string, fullName: string = DEMO_ACCOUNT.fullName): UserProfile => ({
  id: `profile_${userId}`,
  user_id: userId,
  full_name: fullName,
  age: DEMO_PROFILE_DATA.age,
  sex: DEMO_PROFILE_DATA.sex,
  height_cm: DEMO_PROFILE_DATA.height_cm,
  weight_kg: DEMO_PROFILE_DATA.weight_kg,
  fitness_goal: DEMO_PROFILE_DATA.fitness_goal,
  lifestyle_activity: DEMO_PROFILE_DATA.lifestyle_activity,
  diet: DEMO_PROFILE_DATA.diet,
  preferred_activities: [...DEMO_PROFILE_DATA.preferred_activities],
  user_activity_preferences: [...DEMO_PROFILE_DATA.preferred_activities],
  accessibility_needs: [...DEMO_PROFILE_DATA.accessibility_needs],
  has_exercise_restriction: DEMO_PROFILE_DATA.has_exercise_restriction,
  strength_equipment: [...DEMO_PROFILE_DATA.strength_equipment],
  strength_experience: DEMO_PROFILE_DATA.strength_experience,
  onboarding_completed: true,
  updated_at: new Date().toISOString(),
});
