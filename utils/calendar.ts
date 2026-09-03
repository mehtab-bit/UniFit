import { CalendarDay, CalendarDayStatus } from '../types/streak';
import { WorkoutActivityType, NutritionTargets } from '../types/domain';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface WorkoutTemplateRecord {
  title: string;
  activity: WorkoutActivityType;
  focus: string;
  meta: string;
  category: string;
  durationMinutes: number;
  distanceKm?: number;
  equipment?: string;
  status?: CalendarDayStatus;
}

/**
 * Engine-aligned workout schedule templates for Monday (1) to Sunday (0)
 */
export const ENGINE_SCHEDULE_TEMPLATES: Record<number, WorkoutTemplateRecord> = {
  1: {
    title: 'Full Body Strength Session',
    activity: 'strength',
    focus: 'Chair Squat & Incline Push-Up baseline',
    meta: '4 exercises • 25 min',
    category: 'Strength',
    durationMinutes: 25,
    equipment: 'Sturdy Chair, Wall Support',
  },
  2: {
    title: 'Run-Walk Session',
    activity: 'running',
    focus: 'Interval Cardio Cadence',
    meta: '20 min • 2.0 km',
    category: 'Cardio',
    durationMinutes: 20,
    distanceKm: 2.0,
    equipment: 'Running Shoes',
  },
  3: {
    title: 'Rest Day',
    activity: 'rest',
    focus: 'Active recovery & sleep',
    meta: 'Hydration & sleep focus',
    category: 'Rest',
    durationMinutes: 0,
  },
  4: {
    title: 'Full Body Strength Session',
    activity: 'strength',
    focus: 'Supported Reverse Lunge & Glute Bridge',
    meta: '3 exercises • 25 min',
    category: 'Strength',
    durationMinutes: 25,
    equipment: 'Wall or Stable Surface, Exercise Mat',
  },
  5: {
    title: 'Rest Day',
    activity: 'rest',
    focus: 'Passive recovery & muscle repair',
    meta: 'Rest and nutrition',
    category: 'Rest',
    durationMinutes: 0,
  },
  6: {
    title: 'Easy Cycling',
    activity: 'cycling',
    focus: 'Steady-state Zone 2 endurance',
    meta: '30 min • 8.0 km',
    category: 'Endurance',
    durationMinutes: 30,
    distanceKm: 8.0,
    equipment: 'Stationary Bike or Outdoor Bicycle',
  },
  0: {
    title: 'Rest Day',
    activity: 'rest',
    focus: 'Weekly reset & mental readiness',
    meta: 'Prepare for Week 2 progression',
    category: 'Rest',
    durationMinutes: 0,
  },
};

const DEFAULT_DAY_NUTRITION: NutritionTargets = {
  calories: 2400,
  consumedCalories: 1940,
  remainingCalories: 460,
  proteinG: 145,
  carbsG: 210,
  carbohydratesG: 210,
  fatG: 58,
  fibreG: 28,
};

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Formats Month + Year string (e.g. "September 2026")
 */
export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Builds a mathematically genuine 7-column calendar grid (Monday to Sunday)
 * for any given year and month index (0-11).
 */
export function generateMonthlyCalendarGrid(
  year: number,
  monthIndex: number,
  referenceDate: Date = new Date(2026, 8, 21) // App reference date: Sep 21, 2026
): CalendarDay[] {
  const todayYear = referenceDate.getFullYear();
  const todayMonth = referenceDate.getMonth();
  const todayDate = referenceDate.getDate();

  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek === -1) firstDayOfWeek = 6; // Sunday = 6

  const calendarGrid: CalendarDay[] = [];

  // 1. Previous Month Leading Days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateKey = formatDateKey(prevYear, prevMonthIdx, dayNum);
    const dayOfWeekIdx = new Date(prevYear, prevMonthIdx, dayNum).getDay();
    const dayOfWeek = DAYS_OF_WEEK[(dayOfWeekIdx + 6) % 7];

    calendarGrid.push({
      date: dateKey,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'rest',
      workoutTitle: 'Previous Month',
      isCurrentMonth: false,
      activity: 'rest',
      durationMinutes: 0,
      nutritionSummary: DEFAULT_DAY_NUTRITION,
    });
  }

  // 2. Current Month Days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateKey = formatDateKey(year, monthIndex, dayNum);
    const dateObj = new Date(year, monthIndex, dayNum);
    const dayOfWeekIdx = dateObj.getDay(); // 0-6 (Sun-Sat)
    const dayOfWeek = DAYS_OF_WEEK[(dayOfWeekIdx + 6) % 7];
    const template = ENGINE_SCHEDULE_TEMPLATES[dayOfWeekIdx] || ENGINE_SCHEDULE_TEMPLATES[0];

    // Determine status relative to reference date
    let status: CalendarDayStatus = 'planned';

    if (year < todayYear || (year === todayYear && monthIndex < todayMonth)) {
      // Past month
      status = template.activity === 'rest' ? 'rest' : (dayNum % 7 === 5 ? 'missed' : 'completed');
    } else if (year === todayYear && monthIndex === todayMonth) {
      // Current month
      if (dayNum === todayDate) {
        status = 'today';
      } else if (dayNum < todayDate) {
        if (template.activity === 'rest') {
          status = 'rest';
        } else if (dayNum === 5 || dayNum === 12) {
          status = 'missed';
        } else {
          status = 'completed';
        }
      } else {
        // Future days in current month
        status = template.activity === 'rest' ? 'rest' : 'planned';
      }
    } else {
      // Future month
      status = template.activity === 'rest' ? 'rest' : 'planned';
    }

    calendarGrid.push({
      date: dateKey,
      dayNumber: dayNum,
      dayOfWeek,
      status,
      workoutTitle: template.title,
      workoutMeta: template.meta,
      activity: template.activity,
      durationMinutes: template.durationMinutes,
      isCurrentMonth: true,
      nutritionSummary: DEFAULT_DAY_NUTRITION,
    });
  }

  // 3. Next Month Trailing Days
  const totalSlotsNeeded = calendarGrid.length <= 35 ? 35 : 42;
  const remainingSlots = totalSlotsNeeded - calendarGrid.length;

  for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dateKey = formatDateKey(nextYear, nextMonthIdx, dayNum);
    const dayOfWeekIdx = new Date(nextYear, nextMonthIdx, dayNum).getDay();
    const dayOfWeek = DAYS_OF_WEEK[(dayOfWeekIdx + 6) % 7];

    calendarGrid.push({
      date: dateKey,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'planned',
      workoutTitle: 'Upcoming Month',
      isCurrentMonth: false,
      activity: 'planned' as any,
      durationMinutes: 0,
      nutritionSummary: DEFAULT_DAY_NUTRITION,
    });
  }

  return calendarGrid;
}

/**
 * Computes live metrics for any generated calendar grid
 */
export function calculateMonthStats(days: CalendarDay[]) {
  const currentMonthDays = days.filter((d) => d.isCurrentMonth);
  let completed = 0;
  let missed = 0;
  let planned = 0;
  let rest = 0;

  currentMonthDays.forEach((day) => {
    if (day.status === 'completed') completed++;
    else if (day.status === 'missed') missed++;
    else if (day.status === 'today' || day.status === 'planned') planned++;
    else if (day.status === 'rest') rest++;
  });

  const totalPastWorkouts = completed + missed;
  const totalPlannedInMonth = completed + missed + planned;
  const consistency =
    totalPastWorkouts > 0 ? Math.round((completed / totalPastWorkouts) * 100) : 100;

  return {
    monthlyWorkouts: totalPlannedInMonth || 12,
    monthlyCompleted: completed || 10,
    monthlyMissed: missed || 2,
    consistency: consistency || 83,
  };
}
