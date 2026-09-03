/**
 * API-backed implementation of IStreakService.
 */

import { IStreakService } from '../types';
import { StreakData, CalendarDay } from '../../types/domain';
import { apiClient } from './apiClient';
import { mockStreakService } from '../mock/streakMock';

export class StreakApiService implements IStreakService {
  async getStreakData(userId: string = 'user_default'): Promise<StreakData> {
    try {
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
    } catch (err) {
      console.warn('[StreakApiService] Streak API error, returning empty streak:', err);
      const today = new Date();
      return {
        currentStreak: 0,
        bestStreak: 0,
        monthlyWorkouts: 0,
        monthlyCompleted: 0,
        monthlyMissed: 0,
        consistency: 0,
        monthName: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }
  }

  async getMonthlyCalendar(
    year: number,
    monthIndex: number,
    userId?: string
  ): Promise<CalendarDay[]> {
    return mockStreakService.getMonthlyCalendar(year, monthIndex, userId);
  }
}

export const streakApiService = new StreakApiService();
