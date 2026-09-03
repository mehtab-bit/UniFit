import { IStreakService } from '../types';
import { StreakData, CalendarDay } from '../../types/domain';
import {
  generateMonthlyCalendarGrid,
  calculateMonthStats,
  formatMonthYear,
} from '../../utils/calendar';
import { getAppToday } from '../../utils/date';

export class MockStreakService implements IStreakService {
  async getStreakData(_userId?: string): Promise<StreakData> {
    const today = getAppToday();
    const days = generateMonthlyCalendarGrid(today.getFullYear(), today.getMonth(), today);
    const stats = calculateMonthStats(days);

    return {
      currentStreak: 0,
      bestStreak: 0,
      monthlyWorkouts: stats.monthlyWorkouts,
      monthlyCompleted: stats.monthlyCompleted,
      monthlyMissed: stats.monthlyMissed,
      consistency: stats.consistency,
      monthName: formatMonthYear(today.getFullYear(), today.getMonth()),
    };
  }

  async getMonthlyCalendar(
    year: number,
    monthIndex: number,
    _userId?: string
  ): Promise<CalendarDay[]> {
    const today = getAppToday();
    return generateMonthlyCalendarGrid(year, monthIndex, today);
  }
}

export const mockStreakService = new MockStreakService();
