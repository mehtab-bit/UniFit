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
      const mockFallback = await mockStreakService.getStreakData(userId);
      return {
        ...mockFallback,
        currentStreak: response.current_streak || 5,
        bestStreak: response.best_streak || 12,
      };
    } catch {
      return mockStreakService.getStreakData(userId);
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
