import { CalendarDay } from './domain';

export * from './domain';

export type CalendarDayStatus = 'completed' | 'missed' | 'rest' | 'planned' | 'today';

// Unified with CalendarDay to prevent incompatible duplications
export type CalendarDayItem = CalendarDay;
