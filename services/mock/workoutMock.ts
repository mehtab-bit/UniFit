import { IWorkoutService } from '../types';
import {
  WorkoutPlan,
  WorkoutDay,
  Exercise,
  WorkoutCompletionPayload,
  WorkoutActivityType,
} from '../../types/domain';
import { Colors } from '../../constants/colors';
import { ProfileService } from '../../lib/profile';
import { UserProfile } from '../../types/quiz';

/**
 * Standard 5 Strength Families per Fitness Engine Week 1 Specification:
 * 1. Squat: Chair Squat — 2 × 8 — 70 sec rest
 * 2. Lunge: Supported Reverse Lunge — 2 × 8 — 70 sec rest
 * 3. Push-up: Wall Push-Up — 2 × 8 — 70 sec rest
 * 4. Bicep Curl: Light Bottle Bicep Curl — 2 × 8 — 70 sec rest
 * 5. Supported Row: Light Supported One-Arm Row — 2 × 8 — 70 sec rest
 */
export const ENGINE_EXERCISES: Exercise[] = [
  {
    id: 'ex-chair-squat',
    name: 'Chair Squat',
    target: 'Quadriceps & Glutes',
    family: 'squat',
    variationLevel: 'chair',
    sets: 2,
    reps: 8,
    restSeconds: 70,
    unit: 'reps',
    icon: 'activity',
    equipment: 'Sturdy Chair',
    instructions:
      'Stand facing away from a sturdy chair with feet shoulder-width apart. Hinge hips back smoothly until glutes lightly tap the seat without collapsing, then drive through heels to return upright.',
    formCues: [
      'Feet shoulder-width apart in front of a sturdy chair',
      'Hinge hips back and touch seat lightly without collapsing',
      'Drive evenly through heels to return to standing',
    ],
    accessibilityGuidance:
      'Ensure chair is backed against a solid wall to eliminate slip risk. High-contrast floor marking recommended.',
  },
  {
    id: 'ex-supported-lunge',
    name: 'Supported Reverse Lunge',
    target: 'Hamstrings, Quads & Balance',
    family: 'lunge',
    variationLevel: 'supported',
    sets: 2,
    reps: 8,
    restSeconds: 70,
    unit: 'reps',
    icon: 'repeat',
    equipment: 'Wall or Stable Support',
    instructions:
      'Hold a stable wall or rail for support. Take a controlled step backward, lower rear knee toward the floor until both knees reach approximately 90 degrees, then push through front heel.',
    formCues: [
      'Hold a stable wall or chair for balance support',
      'Step back smoothly and lower rear knee toward floor',
      'Keep front knee stacked directly over ankle',
    ],
    accessibilityGuidance:
      'Maintain one hand firmly planted on a hip-height support surface for balance reference throughout.',
  },
  {
    id: 'ex-wall-pushup',
    name: 'Wall Push-Up',
    target: 'Chest, Shoulders & Triceps',
    family: 'pushup',
    variationLevel: 'wall',
    sets: 2,
    reps: 8,
    restSeconds: 70,
    unit: 'reps',
    icon: 'shield',
    equipment: 'Flat Wall Surface',
    instructions:
      'Place palms flat against the wall at chest height slightly wider than shoulders. Maintain a firm torso plank, bend elbows to 45 degrees until forehead nears the wall, then push back smoothly.',
    formCues: [
      'Maintain a rigid straight line from head to heels',
      'Elbows track at a 45-degree angle to torso',
      'Lower toward the wall with controlled 2-second tempo',
    ],
    accessibilityGuidance:
      'Use auditory cadence clicks for 2-second descent and 1-second push tempo.',
  },
  {
    id: 'ex-bottle-bicep-curl',
    name: 'Light Bottle Bicep Curl',
    target: 'Biceps & Forearm Flexors',
    family: 'bicep_curl',
    variationLevel: 'bottle_household',
    sets: 2,
    reps: 8,
    restSeconds: 70,
    unit: 'reps',
    icon: 'activity',
    equipment: 'Filled Water Bottles or Light Weights',
    instructions:
      'Stand or sit tall holding water bottles or light weights. Curl hands smoothly toward shoulders keeping elbows pinned to ribs, squeeze biceps for 1 second, then lower with control.',
    formCues: [
      'Keep elbows pinned to ribs throughout the curl',
      'Squeeze biceps at the top without swinging torso',
      'Lower with controlled 2-second eccentric cadence',
    ],
    accessibilityGuidance:
      'Can be performed seated on a sturdy chair for added stability.',
  },
  {
    id: 'ex-supported-onearm-row',
    name: 'Light Supported One-Arm Row',
    target: 'Upper Back & Latissimus',
    family: 'supported_row',
    variationLevel: 'supported_onearm',
    sets: 2,
    reps: 8,
    restSeconds: 70,
    unit: 'reps',
    icon: 'compass',
    equipment: 'Sturdy Chair Support & Light Weight',
    instructions:
      'Place one hand and knee on a sturdy chair for support. With a light bottle or weight in the free hand, draw elbow upward past the ribcage, squeezing the shoulder blade at the top.',
    formCues: [
      'Keep spine neutral and neck relaxed',
      'Drive elbow upward close to your torso',
      'Lower weight with steady control',
    ],
    accessibilityGuidance:
      'Maintain firm palm placement on support surface for balance reference throughout.',
  },
];

export const MOCK_WEEKLY_DAYS: WorkoutDay[] = [
  {
    id: 'mon',
    date: '2026-09-21',
    dayOfWeek: 'MON',
    dayNumber: '21',
    status: 'today',
    isToday: true,
    title: 'Full Body Strength Session',
    activity: 'strength',
    activity_id: 'strength',
    progression_key: 'strength',
    session_type: 'full_body_base',
    focus: '5 core movement families • 2 × 8 calibration',
    meta: '5 exercises • 25 min',
    category: 'Strength',
    durationMinutes: 25,
    sets: 10,
    reps: 80,
    intensity: 'moderate',
    equipment: 'Sturdy Chair, Wall Support, Light Weight',
    warmUp: [
      '3 min seated shoulder rolls and arm circles',
      '2 min standing hip hinges with hands on thighs',
      '10 ankle rotations clockwise and counterclockwise',
    ],
    workoutInstructions:
      'Focus on controlled tempo and stability throughout each repetition. Complete all prescribed sets before progressing to the next movement. Rest 70 seconds between sets.',
    formCues: [
      'Breathe out during the concentric effort',
      'Maintain neutral head and spinal alignment',
      'Keep feet anchored flat to the ground',
    ],
    cooldown: [
      '2 min deep diaphragmatic breathing',
      'Seated hamstring stretch (30 sec each side)',
      'Doorway chest opening stretch (30 sec hold)',
    ],
    accessibilityGuidance:
      'Spoken audio guidance provides countdown cues before each set. Haptic pulse alerts you at the start of each rest interval.',
    iconName: 'dumbbell',
    iconFamily: 'mci',
    iconColor: Colors.primary,
    iconBg: '#EFF6FF',
    exercises: ENGINE_EXERCISES,
  },
  {
    id: 'tue',
    date: '2026-09-22',
    dayOfWeek: 'TUE',
    dayNumber: '22',
    status: 'planned',
    title: 'Run-Walk Session',
    activity: 'running',
    activity_id: 'walking',
    requested_activity_id: 'running',
    progression_key: 'accessible_cardio',
    session_type: 'indoor_march',
    focus: 'Aerobic base conditioning & interval cadence',
    meta: '20 min • 2.0 km',
    category: 'Cardio',
    durationMinutes: 20,
    distanceKm: 2.0,
    intervalCount: 6,
    workInterval: '60 sec light jog / brisk march',
    recoveryInterval: '90 sec easy walking recovery',
    intensity: 'moderate',
    equipment: 'Running Shoes, Outdoor / Indoor Space',
    warmUp: [
      '4 min brisk walking warm-up at easy pace',
      'Dynamic calf raises and ankle circles',
    ],
    workoutInstructions:
      'Alternate between 60 seconds of gentle cadence and 90 seconds of active recovery walking. Maintain an easy conversational pace.',
    formCues: [
      'Land softly on midfoot beneath your center of gravity',
      'Keep shoulders relaxed and arms swinging naturally',
    ],
    cooldown: [
      '3 min gentle cool-down walk',
      'Standing calf and quadriceps stretches',
    ],
    accessibilityGuidance:
      'Continuous rhythmic audio metronome available for step pacing. Haptic vibrations indicate interval transitions.',
    iconName: 'run',
    iconFamily: 'mci',
    iconColor: '#7C3AED',
    iconBg: '#F3E8FF',
  },
  {
    id: 'wed',
    date: '2026-09-23',
    dayOfWeek: 'WED',
    dayNumber: '23',
    status: 'planned',
    title: 'Rest',
    activity: 'rest',
    activity_id: 'rest',
    progression_key: 'rest',
    session_type: 'active_recovery',
    focus: 'Active recovery, muscle replenishment & sleep',
    meta: 'Hydration & nutrition recovery',
    category: 'Rest',
    intensity: 'low',
    workoutInstructions:
      'Take today off from high-intensity training. Focus on restful sleep, meeting your protein and hydration targets, and gentle walking if desired.',
    formCues: [
      'Aim for 8 hours of restorative sleep tonight',
      'Stay hydrated throughout the day',
    ],
    cooldown: ['5 min gentle full-body breathing and mindfulness'],
    accessibilityGuidance:
      'Rest days help rebuild muscle fibres and prevent overuse fatigue. No equipment needed.',
    iconName: 'heart',
    iconFamily: 'feather',
    iconColor: '#DC2626',
    iconBg: '#FFE4E6',
  },
  {
    id: 'thu',
    date: '2026-09-24',
    dayOfWeek: 'THU',
    dayNumber: '24',
    status: 'planned',
    title: 'Full Body Strength Session',
    activity: 'strength',
    activity_id: 'strength',
    progression_key: 'strength',
    session_type: 'upper_pull_posterior',
    focus: '5 movement patterns • Session 2 reinforcement',
    meta: '5 exercises • 25 min',
    category: 'Strength',
    durationMinutes: 25,
    sets: 10,
    reps: 80,
    intensity: 'moderate',
    equipment: 'Sturdy Chair, Wall Support, Light Weight',
    warmUp: [
      '3 min standing arm swings and gentle torso rotations',
      '10 unloaded bodyweight hip hinges',
    ],
    workoutInstructions:
      'Second strength session of the week. Focus on depth control during lunges and full bicep contraction at peak curl.',
    formCues: [
      'Press through front heel during lunges',
      'Pin elbows to ribs during curls',
    ],
    cooldown: [
      '2 min floor cat-cow spinal flow',
      'Childs pose relaxation (60 sec hold)',
    ],
    accessibilityGuidance:
      'Position yourself near sturdy furniture for seamless balance transitions.',
    iconName: 'dumbbell',
    iconFamily: 'mci',
    iconColor: Colors.primary,
    iconBg: '#EFF6FF',
    exercises: ENGINE_EXERCISES,
  },
  {
    id: 'fri',
    date: '2026-09-25',
    dayOfWeek: 'FRI',
    dayNumber: '25',
    status: 'planned',
    title: 'Rest',
    activity: 'rest',
    activity_id: 'rest',
    progression_key: 'rest',
    session_type: 'passive_recovery',
    focus: 'Passive recovery & tissue regeneration',
    meta: 'Rest and nutrition',
    category: 'Rest',
    intensity: 'low',
    workoutInstructions:
      'Rest and allow your muscular and nervous systems to adapt. Optimal recovery fuels tomorrow’s aerobic session.',
    formCues: ['Prioritize nutrient-dense whole foods today'],
    accessibilityGuidance: 'Enjoy low-stress mobility and hydration.',
    iconName: 'heart',
    iconFamily: 'feather',
    iconColor: '#DC2626',
    iconBg: '#FFE4E6',
  },
  {
    id: 'sat',
    date: '2026-09-26',
    dayOfWeek: 'SAT',
    dayNumber: '26',
    status: 'planned',
    title: 'Easy Cycling',
    activity: 'cycling',
    activity_id: 'cycling',
    progression_key: 'aerobic_endurance',
    session_type: 'zone2_cycling',
    focus: 'Steady-state Zone 2 endurance',
    meta: '30 min • 8.0 km',
    category: 'Endurance',
    durationMinutes: 30,
    distanceKm: 8.0,
    intensity: 'zone2',
    equipment: 'Stationary Bike or Outdoor Bicycle',
    warmUp: [
      '5 min low resistance pedaling cadence (70-80 RPM)',
    ],
    workoutInstructions:
      'Maintain a continuous steady effort where breathing is rhythmic and conversational. Avoid sudden sprint spikes.',
    formCues: [
      'Maintain light grip on handlebars with relaxed shoulders',
      'Pedal smoothly in complete circles rather than mashing down',
    ],
    cooldown: [
      '3 min low-resistance easy spin',
      'Standing calf and quad stretch on floor',
    ],
    accessibilityGuidance:
      'Adjust saddle height so knee has a slight 25-degree bend at bottom pedal stroke. High-contrast display settings compatible.',
    iconName: 'bike',
    iconFamily: 'mci',
    iconColor: '#059669',
    iconBg: '#DCFCE7',
  },
  {
    id: 'sun',
    date: '2026-09-27',
    dayOfWeek: 'SUN',
    dayNumber: '27',
    status: 'planned',
    title: 'Rest',
    activity: 'rest',
    activity_id: 'rest',
    progression_key: 'rest',
    session_type: 'weekly_reset',
    focus: 'Weekly reset & mental readiness',
    meta: 'Prepare for Week 2 progression',
    category: 'Rest',
    intensity: 'low',
    workoutInstructions:
      'Congratulations on completing Week 1! Review your weekly progress and prepare for upcoming session adjustments.',
    formCues: ['Prepare your workout space for tomorrow morning'],
    accessibilityGuidance: 'Review your upcoming schedule in the Streak and Plan tab.',
    iconName: 'heart',
    iconFamily: 'feather',
    iconColor: '#DC2626',
    iconBg: '#FFE4E6',
  },
];

/** Intermediate variants used when the user reports some training experience. */
const INTERMEDIATE_EXERCISES: Exercise[] = [
  {
    id: 'ex-bodyweight-squat',
    name: 'Bodyweight Squat',
    target: 'Quadriceps, Glutes & Core',
    family: 'squat',
    variationLevel: 'bodyweight',
    sets: 3,
    reps: 10,
    restSeconds: 60,
    unit: 'reps',
    icon: 'activity',
    equipment: 'Bodyweight',
    instructions:
      'Stand with feet shoulder-width apart. Sit hips back and down until thighs reach parallel or comfortable depth, then drive through the whole foot to return upright.',
    formCues: ['Knees track over toes', 'Chest stays proud', 'Hips and knees extend together'],
  },
  {
    id: 'ex-bodyweight-lunge',
    name: 'Reverse Lunge',
    target: 'Legs, Glutes & Balance',
    family: 'lunge',
    variationLevel: 'bodyweight',
    sets: 3,
    reps: 8,
    restSeconds: 60,
    unit: 'reps',
    icon: 'repeat',
    equipment: 'Bodyweight',
    instructions:
      'Step one foot back and lower the rear knee toward the floor. Push through the front heel to return and alternate sides.',
    formCues: ['Front knee stacked over ankle', 'Torso tall', 'Controlled tempo'],
  },
  {
    id: 'ex-knee-pushup',
    name: 'Knee Push-Up',
    target: 'Chest, Shoulders & Triceps',
    family: 'pushup',
    variationLevel: 'knee',
    sets: 3,
    reps: 8,
    restSeconds: 60,
    unit: 'reps',
    icon: 'shield',
    equipment: 'Bodyweight',
    instructions:
      'From knees with hands under shoulders, lower the chest toward the floor keeping a straight torso line, then press back up.',
    formCues: ['Straight line from knees to head', 'Elbows about 45 degrees', 'Full range with control'],
  },
  {
    id: 'ex-dumbbell-curl',
    name: 'Dumbbell Bicep Curl',
    target: 'Biceps',
    family: 'bicep_curl',
    variationLevel: 'light_dumbbell',
    sets: 3,
    reps: 10,
    restSeconds: 60,
    unit: 'reps',
    icon: 'dumbbell',
    equipment: 'Dumbbells or Filled Bottles',
    instructions:
      'Stand tall holding dumbbells at your sides. Curl the weights to shoulder height keeping elbows pinned, squeeze, and lower with control.',
    formCues: ['Elbows pinned to ribs', 'No torso swing', 'Lower for a 2-count'],
  },
  {
    id: 'ex-band-row',
    name: 'Resistance Band Row',
    target: 'Upper Back & Rear Delts',
    family: 'supported_row',
    variationLevel: 'band',
    sets: 3,
    reps: 10,
    restSeconds: 60,
    unit: 'reps',
    icon: 'compass',
    equipment: 'Resistance Band',
    instructions:
      'Anchor the band at chest height. Pull both ends toward your ribs, squeezing the shoulder blades together, then return with control.',
    formCues: ['Spine neutral', 'Squeeze shoulder blades', 'Elbows travel near torso'],
  },
];

/** Advanced variants for users who train regularly and have equipment. */
const ADVANCED_EXERCISES: Exercise[] = INTERMEDIATE_EXERCISES.map((ex) => ({
  ...ex,
  sets: (ex.sets ?? 3) + 1,
  reps: (ex.reps ?? 8) + 2,
  variationLevel: `loaded_${ex.variationLevel}`,
}));

function exercisesForProfile(profile: UserProfile | null): Exercise[] {
  const experience = profile?.strength_experience ?? 'new';
  const equipment = profile?.strength_equipment ?? [];
  const hasGear =
    equipment.includes('dumbbells') ||
    equipment.includes('resistance_bands') ||
    equipment.includes('household_weights');
  if (experience === 'regularly_train' && hasGear) return ADVANCED_EXERCISES;
  if (experience === 'some_experience' || experience === 'regularly_train') {
    return hasGear ? INTERMEDIATE_EXERCISES : ENGINE_EXERCISES;
  }
  return ENGINE_EXERCISES;
}

function pickCardio(profile: UserProfile | null): WorkoutActivityType[] {
  const prefs = (profile?.preferred_activities?.length
    ? profile.preferred_activities
    : ['running', 'cycling']
  ).filter((a) => a !== 'strength');
  const pool = ['running', 'cycling', 'walking', 'swimming'] as WorkoutActivityType[];
  const chosen = (['running', 'cycling', 'walking', 'swimming'] as WorkoutActivityType[]).filter(
    (a) => prefs.includes(a as any)
  );
  return chosen.length >= 2 ? chosen : pool.slice(0, 2);
}

function todayStatus(dateStr: string): WorkoutDay['status'] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  if (+date === +today) return 'today';
  if (date < today) return 'completed';
  return 'planned';
}

/**
 * Builds a 7-day plan anchored to the current week (Monday start) so "today"
 * is always correct, personalized to the user's profile.
 */
async function buildPersonalizedWeek(userId?: string): Promise<{ plan: WorkoutPlan; days: WorkoutDay[] }> {
  const profile = await (async () => {
    if (!userId || userId === 'user_default') return null;
    try {
      return await ProfileService.getProfile(userId);
    } catch {
      return null;
    }
  })();

  const exercises = exercisesForProfile(profile);
  const cardio = pickCardio(profile);

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const days: WorkoutDay[] = MOCK_WEEKLY_DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayNumber = String(date.getDate()).padStart(2, '0');

    const updated: WorkoutDay = {
      ...day,
      date: dateStr,
      dayNumber,
      status: todayStatus(dateStr),
      isToday: dateStr === new Date().toISOString().split('T')[0],
    };

    if (day.activity === 'strength' && updated.exercises) {
      updated.exercises = exercises;
    }

    // Personalize cardio days from the user's chosen activities.
    const cardioIndex = ['tue', 'sat'].indexOf(day.id);
    if (cardioIndex >= 0) {
      const activity = cardio[cardioIndex % cardio.length];
      const cardioTitles: Record<string, string> = {
        running: 'Run-Walk Session',
        cycling: 'Easy Cycling',
        walking: 'Brisk Walking Session',
        swimming: 'Easy Swim Session',
      };
      updated.activity = activity;
      updated.activity_id = activity === 'running' ? 'walking' : activity;
      updated.requested_activity_id = activity;
      updated.title = cardioTitles[activity] || updated.title;
      updated.focus =
        activity === 'cycling'
          ? 'Steady-state Zone 2 endurance'
          : activity === 'walking'
          ? 'Aerobic base conditioning at brisk pace'
          : 'Low-impact aerobic conditioning';
      updated.category = activity === 'cycling' ? 'Endurance' : 'Cardio';
      updated.iconName =
        activity === 'running' ? 'run' : activity === 'walking' ? 'walk' : activity === 'swimming' ? 'waves' : 'bike';
      updated.equipment =
        activity === 'swimming' ? 'Pool & Towel' : activity === 'walking' ? 'Walking Shoes' : updated.equipment;
    }

    return updated;
  });

  return {
    plan: {
      id: 'plan-week-1',
      weekNumber: 1,
      title: 'Phase 1: Functional Base Calibration',
      subtitle: "Here's your plan for this week.",
      badgeText: "THIS WEEK'S PLAN",
      description: 'Follow your plan, stay consistent, see results.',
      days,
    },
    days,
  };
}

export class MockWorkoutService implements IWorkoutService {
  async getWeeklyPlan(userId?: string): Promise<WorkoutPlan> {
    return this.getWeeklyWorkoutPlan(userId);
  }

  async getWeeklyWorkoutPlan(userId?: string): Promise<WorkoutPlan> {
    const { plan } = await buildPersonalizedWeek(userId);
    return plan;
  }

  async getTodayWorkout(userId?: string): Promise<WorkoutDay> {
    const { days } = await buildPersonalizedWeek(userId);
    const today = days.find((d) => d.status === 'today') || days[0];
    return today;
  }

  async getTomorrowWorkout(userId?: string): Promise<WorkoutDay> {
    const { days } = await buildPersonalizedWeek(userId);
    const todayIndex = days.findIndex((d) => d.status === 'today');
    const tomorrowIndex = (todayIndex + 1) % days.length;
    return days[tomorrowIndex];
  }

  async getUpcomingWorkouts(userId?: string): Promise<WorkoutDay[]> {
    const { days } = await buildPersonalizedWeek(userId);
    const todayIndex = days.findIndex((d) => d.status === 'today');
    return days.slice(todayIndex + 2, todayIndex + 5);
  }

  async getWorkoutByDate(date: string, userId?: string): Promise<WorkoutDay | null> {
    const { days } = await buildPersonalizedWeek(userId);
    const match = days.find((d) => d.date === date);
    return match || days[0];
  }

  /**
   * Submits workout completion data to service layer per engine contract (Section 6).
   */
  async logWorkoutCompletion(
    payloadOrId: string | WorkoutCompletionPayload,
    _durationMinutes?: number,
    _repsCompleted?: number,
    _userId?: string
  ): Promise<{ success: boolean; completedAt: string }> {
    return {
      success: true,
      completedAt: new Date().toISOString(),
    };
  }
}

export const mockWorkoutService = new MockWorkoutService();
