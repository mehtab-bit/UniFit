/**
 * API-backed implementation of IWorkoutService.
 * Calls the FastAPI backend connected to the authoritative Python fitness engine.
 */

import { IWorkoutService } from '../types';
import {
  WorkoutPlan,
  WorkoutDay,
  Exercise,
  WorkoutCompletionPayload,
  WorkoutActivityType,
  WorkoutDayStatus,
} from '../../types/domain';
import { apiClient } from './apiClient';
import { Colors } from '../../constants/colors';
import { fetchCombinedWeek, clearCombinedWeek } from './combinedPlan';

function mapIconForActivity(activity: string): {
  iconName: string;
  iconFamily: 'feather' | 'mci';
  iconColor: string;
  iconBg: string;
} {
  switch (activity.toLowerCase()) {
    case 'strength':
      return {
        iconName: 'dumbbell',
        iconFamily: 'mci',
        iconColor: Colors.primary,
        iconBg: '#EFF6FF',
      };
    case 'running':
      return {
        iconName: 'run',
        iconFamily: 'mci',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
      };
    case 'cycling':
      return {
        iconName: 'bike',
        iconFamily: 'mci',
        iconColor: '#0891B2',
        iconBg: '#ECFEFF',
      };
    case 'walking':
      return {
        iconName: 'walk',
        iconFamily: 'mci',
        iconColor: '#059669',
        iconBg: '#F0FDF4',
      };
    case 'rest':
    default:
      return {
        iconName: 'heart',
        iconFamily: 'feather',
        iconColor: '#DC2626',
        iconBg: '#FFE4E6',
      };
  }
}

function mapBackendDayToWorkoutDay(backendDay: any, index: number, currentDayIndex: number): WorkoutDay {
  const isRest = backendDay.is_rest_day;
  const workout = backendDay.workout || {};
  const activity = (isRest ? 'rest' : workout.activity_id || workout.activity || 'strength') as WorkoutActivityType;
  const icons = mapIconForActivity(activity);

  const dayAbbrevs = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayOfWeek = dayAbbrevs[index % 7];

  // Prefer the explicit local date assigned by the backend plan snapshot so
  // navigation can never shift the user's schedule.
  const today = new Date();
  const dayOffset = index - currentDayIndex;
  const dayDate = new Date(today);
  dayDate.setDate(today.getDate() + dayOffset);
  const derivedDate = dayDate.toISOString().split('T')[0];
  const dateStr = backendDay.local_date || derivedDate;
  const parsedDay = new Date(`${dateStr}T00:00:00`);
  const dayNumber = String(parsedDay.getDate()).padStart(2, '0');

  let status: WorkoutDayStatus = 'planned';
  if (isRest) {
    status = 'rest';
  } else if (index === currentDayIndex) {
    status = 'today';
  }

  const mappedExercises: Exercise[] = (workout.exercises || []).map((ex: any, exIdx: number) => ({
    id: ex.id || `ex-${exIdx}`,
    name: ex.name || ex.exercise_name || 'Exercise',
    target: ex.target || 'General Movement',
    family: ex.family || ex.exercise_family,
    repMode: ex.rep_mode || ex.repMode,
    variationLevel: ex.variation_level || ex.difficulty_level,
    sets: ex.sets || 2,
    reps: ex.reps || 8,
    durationSeconds: ex.duration_seconds,
    restSeconds: ex.rest_seconds || 70,
    unit: 'reps',
    icon: 'activity',
    equipment: ex.equipment,
    formCues: ex.form_cues || [],
    instructions: ex.instructions || ex.description,
    accessibilityGuidance:
      ex.accessibility_guidance?.audio_instruction ||
      ex.audio_instruction ||
      ex.safety_note,
  }));

  const duration =
    workout.duration_min ||
    (activity === 'strength' ? 25 : isRest ? 0 : 30);

  let meta = 'Rest and recovery';
  if (!isRest) {
    if (activity === 'strength' && mappedExercises.length > 0) {
      meta = `${mappedExercises.length} exercises • ${duration} min`;
    } else if (workout.distance_km) {
      meta = `${duration} min • ${workout.distance_km} km`;
    } else {
      meta = `${duration} min`;
    }
  }

  return {
    id: backendDay.scheduled_workout_id || `day_${index + 1}`,
    date: dateStr,
    dayOfWeek,
    dayNumber,
    status,
    title: isRest ? 'Rest' : workout.title || 'Workout Session',
    activity,
    activity_id: workout.activity_id || (isRest ? 'rest' : 'strength'),
    requested_activity_id: workout.requested_activity_id,
    progression_key: workout.progression_key || (isRest ? 'rest' : 'strength'),
    session_type: workout.session_type,
    focus: isRest ? 'Active Recovery' : workout.title,
    meta,
    category: isRest ? 'Rest' : activity === 'strength' ? 'Strength' : activity === 'cycling' ? 'Endurance' : 'Cardio',
    durationMinutes: duration,
    distanceKm: workout.distance_km,
    sets: activity === 'strength' ? (workout.sets || (mappedExercises.length ? mappedExercises.length * 2 : 10)) : undefined,
    reps: activity === 'strength' ? (workout.reps || 80) : undefined,
    intervalCount: workout.interval_count || (activity === 'running' ? 6 : undefined),
    workInterval: workout.work_interval_sec ? `${workout.work_interval_sec} sec work` : (activity === 'running' ? '60 sec run / brisk march' : undefined),
    recoveryInterval: workout.recovery_interval_sec ? `${workout.recovery_interval_sec} sec recovery` : (activity === 'running' ? '90 sec easy walking recovery' : undefined),
    intensity: workout.intensity || 'moderate',
    equipment: workout.equipment,
    warmUp: workout.warmup ? [workout.warmup] : [],
    workoutInstructions: workout.workout_instructions || workout.main_description,
    formCues: workout.form_cues || [],
    cooldown: workout.cooldown ? [workout.cooldown] : [],
    accessibilityGuidance: workout.safety_note || workout.cooldown_audio,
    isToday: index === currentDayIndex,
    iconName: icons.iconName,
    iconFamily: icons.iconFamily,
    iconColor: icons.iconColor,
    iconBg: icons.iconBg,
    exercises: mappedExercises.length > 0 ? mappedExercises : undefined,
  };
}

export class WorkoutApiService implements IWorkoutService {
  async getWeeklyPlan(userId: string = 'user_default', forceRefresh: boolean = false): Promise<WorkoutPlan> {
    const response: any = await fetchCombinedWeek(userId, { force: forceRefresh });

    const rawDays = response.workouts || [];
    const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

    const mappedDays: WorkoutDay[] = rawDays.map((d: any, idx: number) =>
      mapBackendDayToWorkoutDay(d, idx, currentDayIndex)
    );

    return {
      id: `plan_week_${response.week_number || 1}`,
      weekNumber: response.week_number || 1,
      title: 'Week 1 Foundation',
      subtitle: "Here's your plan for this week.",
      badgeText: 'Week 1',
      description: 'Progressive adaptive fitness week powered by the engine.',
      days: mappedDays,
    };
  }

  async getWeeklyWorkoutPlan(userId?: string): Promise<WorkoutPlan> {
    return this.getWeeklyPlan(userId);
  }

  async getTodayWorkout(userId?: string): Promise<WorkoutDay> {
    const plan = await this.getWeeklyPlan(userId);
    const today = plan.days.find((d) => d.status === 'today') || plan.days[0];
    return today;
  }

  async getTomorrowWorkout(userId?: string): Promise<WorkoutDay> {
    const plan = await this.getWeeklyPlan(userId);
    const todayIdx = plan.days.findIndex((d) => d.status === 'today');
    const tomorrowIdx = (todayIdx + 1) % plan.days.length;
    return plan.days[tomorrowIdx];
  }

  async getUpcomingWorkouts(userId?: string): Promise<WorkoutDay[]> {
    const plan = await this.getWeeklyPlan(userId);
    return plan.days.filter((d) => d.status !== 'today' && d.status !== 'completed');
  }

  async getWorkoutByDate(dateOrId: string, userId?: string): Promise<WorkoutDay | null> {
    const plan = await this.getWeeklyPlan(userId);
    const normalized = (dateOrId || '').toLowerCase().trim();
    const matched = plan.days.find(
      (d) =>
        d.date === dateOrId ||
        d.id.toLowerCase() === normalized ||
        d.dayOfWeek.toLowerCase() === normalized ||
        d.activity.toLowerCase() === normalized
    );
    if (matched) return matched;

    const response: any = await apiClient.get(`/api/v1/workout/${dateOrId}?user_id=${userId || 'user_default'}`);
    const currentDayIndex = (new Date().getDay() + 6) % 7;
    return mapBackendDayToWorkoutDay(response, 0, currentDayIndex);
  }

  async logWorkoutCompletion(
    payloadOrId: string | WorkoutCompletionPayload,
    durationMinutes: number = 25,
    repsCompleted: number = 80,
    userId?: string
  ): Promise<{ success: boolean; completedAt: string }> {
    let body: WorkoutCompletionPayload;
    if (typeof payloadOrId === 'string') {
      body = {
        user_id: userId || 'user_default',
        activity_id: payloadOrId,
        progression_key: payloadOrId,
        completion_pct: 100,
        exercise_completion_pct: {
          squat: 100,
          lunge: 100,
          pushup: 100,
          bicep_curl: 100,
          supported_row: 100,
        },
      };
    } else {
      body = payloadOrId;
      if (!body.user_id) {
        body = { ...body, user_id: userId || 'user_default' };
      }
    }

    await apiClient.post('/api/v1/workout/complete', body);
    clearCombinedWeek(userId || body.user_id || '');
    return {
      success: true,
      completedAt: new Date().toISOString(),
    };
  }
}

export const workoutApiService = new WorkoutApiService();
