import {
  SexOption,
  FitnessGoalOption,
  LifestyleActivityOption,
  ActivityPreferenceOption,
  DietOption,
  AccessibilityNeedOption,
  BlindLowVisionResourceOption,
  StrengthEquipmentOption,
  StrengthExperienceOption,
  UserProfile,
} from './domain';

export * from './domain';

export interface QuizFormData {
  age: string;
  sex: SexOption | null;
  height_cm: string;
  weight_kg: string;
  fitness_goal: FitnessGoalOption | null;
  lifestyle_activity: LifestyleActivityOption | null;
  user_activity_preferences: ActivityPreferenceOption[];
  diet: DietOption | null;
  accessibility_needs: AccessibilityNeedOption[];
  accessibility_other_details: string;
  blind_low_vision_resources: BlindLowVisionResourceOption[];
  has_exercise_restriction: boolean | null;
  exercise_restriction_description: string;
  strength_equipment: StrengthEquipmentOption[];
  strength_equipment_other: string;
  strength_experience: StrengthExperienceOption | null;
}

export interface QuizDraftStorage {
  step: number;
  data: QuizFormData;
  lastUpdated: string;
}
