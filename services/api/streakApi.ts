/**
 * API-backed implementation of IStreakService.
 */

import { IStreakService } from '../types';
import { StreakData, CalendarDay } from '../../types/domain';
import { apiClient } from './apiClient';
import { getAppToday } from '../../utils/date';
import {
  generateMonthlyCalendarGrid,
  overlayCalendarDays,
} from '../../utils/calendar';

export class StreakApiService implements IStreakService {
  async getStreakData(userId: string = 'user_default'): Promise<StreakData> {
    const response: any = await apiClient.get(`/api/v1/streak?user_id=${userId}`);
    return {
      currentStreak: response.current_streak || 0,
      bestStreak: response.best_streak || 0,
      monthlyWorkouts: 0,
      monthlyCompleted: 0,
      monthlyMissed: 0,
      consistency: response.weekly_adherence_pct || 0,
      monthName: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }

  async getMonthlyCalendar(
    year: number,
    monthIndex: number,
    userId?: string
  ): Promise<CalendarDay[]> {
    const response: any = await apiClient.get(
      `/api/v1/calendar?year=${year}&month=${monthIndex + 1}&user_id=${
        userId || 'user_default'
      }`
    );
    const grid = generateMonthlyCalendarGrid(year, monthIndex, getAppToday());
    return overlayCalendarDays(grid, response?.days || []);
  }
}

export const streakApiService = new StreakApiService();
