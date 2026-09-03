/**
 * API-backed implementation of IActivityService.
 */

import { IActivityService } from '../types';
import { ActivitySession, ActivitySummary } from '../../types/domain';
import { mockActivityService } from '../mock/activityMock';

export class ActivityApiService implements IActivityService {
  async getRecentSessions(userId?: string): Promise<ActivitySession[]> {
    return mockActivityService.getRecentSessions(userId);
  }

  async getWeeklySummary(userId?: string): Promise<ActivitySummary> {
    return mockActivityService.getWeeklySummary(userId);
  }
}

export const activityApiService = new ActivityApiService();
