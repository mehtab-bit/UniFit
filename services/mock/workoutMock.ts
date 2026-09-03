import { IWorkoutService } from '../types';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutCompletionPayload } from '../../types/domain';
import { Colors } from '../../constants/colors';

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

export class MockWorkoutService implements IWorkoutService {
  async getWeeklyPlan(_userId?: string): Promise<WorkoutPlan> {
    return this.getWeeklyWorkoutPlan(_userId);
  }

  async getWeeklyWorkoutPlan(_userId?: string): Promise<WorkoutPlan> {
    return {
      id: 'plan-week-1',
      weekNumber: 1,
      title: 'Phase 1: Functional Base Calibration',
      subtitle: "Here's your plan for this week.",
      badgeText: "THIS WEEK'S PLAN",
      description: 'Follow your plan, stay consistent, see results.',
      days: MOCK_WEEKLY_DAYS,
    };
  }

  async getTodayWorkout(_userId?: string): Promise<WorkoutDay> {
    const today = MOCK_WEEKLY_DAYS.find((d) => d.status === 'today') || MOCK_WEEKLY_DAYS[0];
    return today;
  }

  async getTomorrowWorkout(_userId?: string): Promise<WorkoutDay> {
    const todayIndex = MOCK_WEEKLY_DAYS.findIndex((d) => d.status === 'today');
    const tomorrowIndex = (todayIndex + 1) % MOCK_WEEKLY_DAYS.length;
    return MOCK_WEEKLY_DAYS[tomorrowIndex];
  }

  async getUpcomingWorkouts(_userId?: string): Promise<WorkoutDay[]> {
    const todayIndex = MOCK_WEEKLY_DAYS.findIndex((d) => d.status === 'today');
    return MOCK_WEEKLY_DAYS.slice(todayIndex + 2, todayIndex + 5);
  }

  async getWorkoutByDate(date: string, _userId?: string): Promise<WorkoutDay | null> {
    const match = MOCK_WEEKLY_DAYS.find((d) => d.date === date);
    return match || MOCK_WEEKLY_DAYS[0];
  }

  /**
   * Submits workout completion data to service layer per engine contract (Section 6).
   */
  async logWorkoutCompletion(
    payloadOrId: string | WorkoutCompletionPayload,
    _durationMinutes?: number,
    _repsCompleted?: number
  ): Promise<{ success: boolean; completedAt: string }> {
    return {
      success: true,
      completedAt: new Date().toISOString(),
    };
  }
}

export const mockWorkoutService = new MockWorkoutService();
