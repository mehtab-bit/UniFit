/**
 * UniFit Frontend Domain Models.
 * Clean, strongly typed models aligned directly with the UniFit Inclusive Adaptive Fitness Engine specifications.
 * Decoupled from presentation UI and fully ready for backend API mapping.
 */

// -------------------------------------------------------------
// 1. User & Profile Models (Matches Engine Inputs)
// -------------------------------------------------------------
export type SexOption = 'male' | 'female';
export type FitnessGoalOption = 'lose_fat' | 'maintain' | 'muscle_gain';
export type LifestyleActivityOption = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type ActivityPreferenceOption = 'walking' | 'running' | 'cycling' | 'swimming';
export type DietOption = 'vegan' | 'vegetarian' | 'eggetarian' | 'non_vegetarian';
export type AccessibilityNeedOption = 'blind_low_vision' | 'deaf_hard_of_hearing' | 'other' | 'none';

export type AccessibilityResourceOption =
  | 'safe_indoor_space'
  | 'stable_support'
  | 'guide'
  | 'stationary_bike'
  | 'accessible_pool_support'
  // Compatibility aliases
  | 'indoor_space'
  | 'exercise_partner'
  | 'accessible_pool';

export type BlindLowVisionResourceOption = AccessibilityResourceOption;

export type StrengthEquipmentOption =
  | 'no_equipment'
  | 'dumbbells'
  | 'resistance_bands'
  | 'household_weights'
  | 'other';
export type StrengthExperienceOption = 'new' | 'some_experience' | 'regularly_train';

export interface UserProfile {
  id?: string;
  user_id: string;
  full_name: string;
  age: number | null;
  sex: SexOption | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: FitnessGoalOption | null;
  lifestyle_activity: LifestyleActivityOption | null;
  preferred_activities: ActivityPreferenceOption[];
  user_activity_preferences?: ActivityPreferenceOption[]; // Compatibility alias
  diet: DietOption | null;
  accessibility_needs: AccessibilityNeedOption[];
  accessibility_other_details?: string;
  blind_low_vision_resources?: AccessibilityResourceOption[];
  has_exercise_restriction: boolean | null;
  exercise_restriction_description?: string;
  strength_equipment: StrengthEquipmentOption[];
  strength_equipment_other?: string;
  strength_experience: StrengthExperienceOption | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Exact schema expected by the Python Inclusive Adaptive Fitness Engine.
 * Activity preferences are maintained separately.
 */
export interface EngineProfilePayload {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  lifestyle_activity: string;
  diet: string;
  accessibility_id: string;
}

// -------------------------------------------------------------
// 2. Workout & Strength Models (5 Core Families & Progression)
// -------------------------------------------------------------
export type WorkoutDayStatus = 'planned' | 'today' | 'completed' | 'missed' | 'rest';

export type WorkoutActivityType =
  | 'strength'
  | 'running'
  | 'cycling'
  | 'walking'
  | 'swimming'
  | 'rest'
  | 'mobility';

export type WorkoutIntensity = 'low' | 'moderate' | 'high' | 'zone2' | 'interval';

export type StrengthFamily =
  | 'squat'
  | 'lunge'
  | 'pushup'
  | 'bicep_curl'
  | 'supported_row';

export interface Exercise {
  id: string;
  name: string;
  target: string;
  family?: StrengthFamily;
  repMode?: 'total_reps' | 'reps_each_side' | 'reps_each_arm';
  variationLevel?: string | number; // e.g. 'chair', 'bodyweight', 'loaded'
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  unit?: string; // 'reps' | 'sec'
  icon?: string;
  equipment?: string;
  formCues?: string[];
  instructions?: string;
  accessibilityGuidance?: string;
}

export interface WorkoutDay {
  id: string;
  date: string; // ISO YYYY-MM-DD
  dayOfWeek: string; // "MON", "TUE", etc.
  dayNumber: string | number; // "21", "22", etc.
  status: WorkoutDayStatus;
  title: string;
  activity: WorkoutActivityType;
  // Distinct engine activity & progression identifiers
  activity_id?: string;
  requested_activity_id?: string;
  progression_key?: string;
  session_type?: string;
  focus?: string;
  meta?: string;
  category?: string; // "Strength" | "Cardio" | "Endurance" | "Rest" | "Recovery"
  durationMinutes?: number;
  distanceKm?: number;
  sets?: number;
  reps?: number;
  intervalCount?: number;
  workInterval?: string; // e.g. "60 sec jog"
  recoveryInterval?: string; // e.g. "90 sec brisk walk"
  intensity?: WorkoutIntensity;
  equipment?: string; // e.g. "Chair", "Bodyweight", "Dumbbells", "Bicycle"
  warmUp?: string[]; // Warmup exercise sequence
  workoutInstructions?: string; // Step-by-step guidance
  formCues?: string[]; // Primary movement alignment cues
  cooldown?: string[]; // Cooldown protocol
  accessibilityGuidance?: string; // Inclusive safety & auditory positioning guidance
  isToday?: boolean;
  iconName?: string;
  iconFamily?: 'feather' | 'mci';
  iconColor?: string;
  iconBg?: string;
  exercises?: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  weekNumber: number;
  title: string;
  subtitle: string;
  badgeText: string;
  description: string;
  days: WorkoutDay[];
}

export interface PlanWorkoutItem {
  id: string;
  dayLabel: string;
  title: string;
  focus: string;
  meta: string;
  category: string;
  status: WorkoutDayStatus;
  activity?: WorkoutActivityType;
  exercisesCount?: number;
  durationMinutes?: number;
}

/**
 * Payload sent to backend engine on workout completion.
 * The backend decides whether the activity progresses or holds.
 */
export interface WorkoutCompletionPayload {
  user_id?: string;
  activity_id: string;
  requested_activity_id?: string;
  progression_key: string;
  session_type?: string;
  completion_pct: number;
  exercise_completion_pct?: Record<string, number>;
  source?: 'camera' | 'manual' | 'activity';
  reps_completed?: number;
  range_score?: number | null;
  issue_codes?: string[];
}

// -------------------------------------------------------------
// 3. Nutrition & Meal Models (Matches Engine Specifications)
// -------------------------------------------------------------
export type MealType = 'breakfast' | 'lunch' | 'evening_snack' | 'dinner';

export interface ScaledIngredient {
  name: string;
  amount: string; // e.g. "60g", "1 tbsp (16g)", "150g"
}

export interface MealNutrition {
  calories: number;
  proteinG: number;
  carbohydratesG?: number | null; // Optional: engine distinguishes missing from real 0
  fatG: number;
  fibreG?: number | null; // Optional: engine distinguishes missing from real 0
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG?: number | null;
  carbohydratesG?: number | null; // Optional to reflect missing values
  fatG: number;
  fibreG?: number | null; // Optional to reflect missing values
  waterMl?: number;
  consumedCalories?: number;
  remainingCalories?: number;
}

export interface Meal {
  id: string;
  mealType: MealType;
  title: string;
  time: string;
  servingLabel: string; // e.g. "2 servings", "1 hearty bowl"
  servings: number;
  calories: number;
  caloriesFormatted: string; // "480 kcal"
  proteinG: number;
  carbsG?: number | null; // Compatibility alias
  carbohydratesG?: number | null;
  fatG: number;
  fibreG?: number | null;
  nutrition: MealNutrition;
  items: string;
  ingredients: string[];
  scaledIngredientQuantities: ScaledIngredient[];
  preparationNote: string;
  prepNote?: string; // Compatibility alias
  icon: string;
}

export interface MealPlan {
  id: string;
  date: string;
  targets: NutritionTargets;
  meals: Meal[];
}

// -------------------------------------------------------------
// 4. Activity Models
// -------------------------------------------------------------
export type ActivityType = 'walking' | 'running' | 'cycling' | 'swimming' | 'strength';

export interface ActivitySession {
  id: string;
  title: string;
  type: ActivityType;
  activity_id?: string;
  requested_activity_id?: string;
  progression_key?: string;
  session_type?: string;
  duration: string;
  durationMinutes: number;
  distance?: string;
  distanceKm?: number;
  calories: string;
  caloriesNum: number;
  intensity?: WorkoutIntensity;
  icon: string;
  color: string;
  timestamp: string;
}

export interface ActivitySummary {
  sessionsCount: number;
  activeMinutes: number;
  activeCalories: number;
  totalDistanceKm?: number;
}

// -------------------------------------------------------------
// 5. Streak & Calendar Models
// -------------------------------------------------------------
export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  monthlyWorkouts: number;
  monthlyCompleted: number;
  monthlyMissed: number;
  consistency: number; // 0 - 100 percentage
  monthName: string;
}

export interface CalendarDay {
  date: string; // ISO format: YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: string;
  status: WorkoutDayStatus;
  workoutTitle?: string;
  workoutMeta?: string;
  activity?: WorkoutActivityType;
  durationMinutes?: number;
  isCurrentMonth?: boolean;
  workout?: WorkoutDay;
  nutritionSummary?: NutritionTargets;
  meals?: Meal[];
}

// -------------------------------------------------------------
// 6. Movement Analysis / Vision Feedback Boundary (Internal Model)
// -------------------------------------------------------------
export interface CVFeedback {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  formScore: number;
  correction?: string;
  isCorrect?: boolean;
  feedbackMessage: string;
  feedbackType: 'info' | 'correction' | 'success';
}

// -------------------------------------------------------------
// 7. Progress & Milestones Models (Progression Engine Data)
// -------------------------------------------------------------
export interface ProgressMilestone {
  id: string;
  title: string;
  date: string;
  status: 'Completed' | 'Ready' | 'In Progress' | 'Upcoming';
  icon: string;
}

export interface ProgressSummary {
  workoutsCompleted: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  currentStreak: number;
  bestStreak: number;
  totalActiveMinutes: number;
  adherenceScore: number;
  phaseTitle: string;
  milestones: ProgressMilestone[];
  // Backend progression state (never calculated in frontend)
  activity_rule_week?: number | Record<string, number>;
  exercise_rule_week?: Record<string, number>;
  strength_variation_levels?: Record<string, string>;
}

// -------------------------------------------------------------
// 8. Generic Async State Model
// -------------------------------------------------------------
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// -------------------------------------------------------------
// 9. Workout Reflection Note Model
// -------------------------------------------------------------
export interface WorkoutNote {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string;
  updatedAt: string;
}
