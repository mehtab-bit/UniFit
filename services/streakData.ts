import { StreakData, CalendarDayItem, PlanWorkoutItem } from '../types/streak';

/**
 * Engine-aligned streak metrics for UniFit athlete.
 * Centralized mock data matching Week 1 calibration.
 */
export const defaultStreakData: StreakData = {
  currentStreak: 5,
  bestStreak: 12,
  monthlyWorkouts: 12,
  monthlyCompleted: 10,
  monthlyMissed: 2,
  consistency: 83,
  monthName: 'September 2026',
};

/**
 * September 2026 calendar days data aligned with the 7-day engine schedule:
 * Mon: Full Body Strength (25 min)
 * Tue: Run-Walk Session (20 min, 2.0 km)
 * Wed: Rest
 * Thu: Full Body Strength (25 min)
 * Fri: Rest
 * Sat: Easy Cycling (30 min, 8.0 km)
 * Sun: Rest
 */
export const defaultCalendarDays: CalendarDayItem[] = [
  // Week 1 (Mon Aug 31 / Tue Sep 1)
  { date: '2026-08-31', dayNumber: 31, dayOfWeek: 'Mon', status: 'rest', isCurrentMonth: false },
  { date: '2026-09-01', dayNumber: 1, dayOfWeek: 'Tue', status: 'completed', workoutTitle: 'Run-Walk Session', workoutMeta: '20 min • 2.0 km', isCurrentMonth: true },
  { date: '2026-09-02', dayNumber: 2, dayOfWeek: 'Wed', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-03', dayNumber: 3, dayOfWeek: 'Thu', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-04', dayNumber: 4, dayOfWeek: 'Fri', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-05', dayNumber: 5, dayOfWeek: 'Sat', status: 'missed', workoutTitle: 'Easy Cycling', workoutMeta: '30 min • 8.0 km', isCurrentMonth: true },
  { date: '2026-09-06', dayNumber: 6, dayOfWeek: 'Sun', status: 'rest', workoutTitle: 'Rest', isCurrentMonth: true },

  // Week 2
  { date: '2026-09-07', dayNumber: 7, dayOfWeek: 'Mon', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-08', dayNumber: 8, dayOfWeek: 'Tue', status: 'completed', workoutTitle: 'Run-Walk Session', workoutMeta: '20 min • 2.0 km', isCurrentMonth: true },
  { date: '2026-09-09', dayNumber: 9, dayOfWeek: 'Wed', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-10', dayNumber: 10, dayOfWeek: 'Thu', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-11', dayNumber: 11, dayOfWeek: 'Fri', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-12', dayNumber: 12, dayOfWeek: 'Sat', status: 'missed', workoutTitle: 'Easy Cycling', workoutMeta: '30 min • 8.0 km', isCurrentMonth: true },
  { date: '2026-09-13', dayNumber: 13, dayOfWeek: 'Sun', status: 'rest', workoutTitle: 'Rest', isCurrentMonth: true },

  // Week 3
  { date: '2026-09-14', dayNumber: 14, dayOfWeek: 'Mon', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-15', dayNumber: 15, dayOfWeek: 'Tue', status: 'completed', workoutTitle: 'Run-Walk Session', workoutMeta: '20 min • 2.0 km', isCurrentMonth: true },
  { date: '2026-09-16', dayNumber: 16, dayOfWeek: 'Wed', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-17', dayNumber: 17, dayOfWeek: 'Thu', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-18', dayNumber: 18, dayOfWeek: 'Fri', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-19', dayNumber: 19, dayOfWeek: 'Sat', status: 'rest', workoutTitle: 'Easy Cycling', workoutMeta: '30 min • 8.0 km', isCurrentMonth: true },
  { date: '2026-09-20', dayNumber: 20, dayOfWeek: 'Sun', status: 'rest', workoutTitle: 'Rest', isCurrentMonth: true },

  // Week 4 (Active week)
  { date: '2026-09-21', dayNumber: 21, dayOfWeek: 'Mon', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-22', dayNumber: 22, dayOfWeek: 'Tue', status: 'completed', workoutTitle: 'Run-Walk Session', workoutMeta: '20 min • 2.0 km', isCurrentMonth: true },
  { date: '2026-09-23', dayNumber: 23, dayOfWeek: 'Wed', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-24', dayNumber: 24, dayOfWeek: 'Thu', status: 'completed', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-25', dayNumber: 25, dayOfWeek: 'Fri', status: 'completed', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-09-26', dayNumber: 26, dayOfWeek: 'Sat', status: 'today', workoutTitle: 'Easy Cycling', workoutMeta: '30 min • 8.0 km', isCurrentMonth: true },
  { date: '2026-09-27', dayNumber: 27, dayOfWeek: 'Sun', status: 'planned', workoutTitle: 'Rest', workoutMeta: 'Weekly Reset', isCurrentMonth: true },

  // Week 5 (Remaining September days)
  { date: '2026-09-28', dayNumber: 28, dayOfWeek: 'Mon', status: 'planned', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: true },
  { date: '2026-09-29', dayNumber: 29, dayOfWeek: 'Tue', status: 'planned', workoutTitle: 'Run-Walk Session', workoutMeta: '20 min • 2.0 km', isCurrentMonth: true },
  { date: '2026-09-30', dayNumber: 30, dayOfWeek: 'Wed', status: 'planned', workoutTitle: 'Rest', workoutMeta: 'Recovery', isCurrentMonth: true },
  { date: '2026-10-01', dayNumber: 1, dayOfWeek: 'Thu', status: 'planned', workoutTitle: 'Full Body Strength Session', workoutMeta: '25 min', isCurrentMonth: false },
  { date: '2026-10-02', dayNumber: 2, dayOfWeek: 'Fri', status: 'planned', workoutTitle: 'Rest', isCurrentMonth: false },
  { date: '2026-10-03', dayNumber: 3, dayOfWeek: 'Sat', status: 'planned', workoutTitle: 'Easy Cycling', workoutMeta: '30 min • 8.0 km', isCurrentMonth: false },
  { date: '2026-10-04', dayNumber: 4, dayOfWeek: 'Sun', status: 'rest', isCurrentMonth: false },
];

export const defaultTodayWorkout: PlanWorkoutItem = {
  id: 'today-workout',
  dayLabel: 'TODAY',
  title: 'Full Body Strength Session',
  focus: '5 movement patterns • 2 × 8 calibration',
  meta: '5 exercises • 25 min',
  category: 'Strength',
  status: 'today',
  exercisesCount: 5,
  durationMinutes: 25,
};

export const defaultTomorrowWorkout: PlanWorkoutItem = {
  id: 'tomorrow-workout',
  dayLabel: 'TOMORROW',
  title: 'Run-Walk Session',
  focus: 'Aerobic base conditioning',
  meta: '20 min • 2.0 km',
  category: 'Cardio',
  status: 'planned',
  durationMinutes: 20,
};

export const defaultUpcomingPlan: PlanWorkoutItem[] = [
  {
    id: 'up-1',
    dayLabel: 'Wed',
    title: 'Rest',
    focus: 'Active recovery & replenishment',
    meta: 'Rest',
    category: 'Rest',
    status: 'planned',
  },
  {
    id: 'up-2',
    dayLabel: 'Thu',
    title: 'Full Body Strength Session',
    focus: 'Session 2 progression baseline',
    meta: '5 exercises • 25 min',
    category: 'Strength',
    status: 'planned',
  },
  {
    id: 'up-3',
    dayLabel: 'Fri',
    title: 'Rest',
    focus: 'Passive recovery & muscle repair',
    meta: 'Rest',
    category: 'Rest',
    status: 'planned',
  },
  {
    id: 'up-4',
    dayLabel: 'Sat',
    title: 'Easy Cycling',
    focus: 'Steady-state Zone 2 endurance',
    meta: '30 min • 8.0 km',
    category: 'Endurance',
    status: 'planned',
  },
  {
    id: 'up-5',
    dayLabel: 'Sun',
    title: 'Rest',
    focus: 'Weekly reset & preparation',
    meta: 'Rest',
    category: 'Rest',
    status: 'planned',
  },
];
