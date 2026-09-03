/**
 * API-backed implementation of IProgressService.
 */

import { IProgressService } from '../types';
import { ProgressSummary } from '../../types/domain';
import { apiClient } from './apiClient';
import { mockProgressService } from '../mock/progressMock';

export class ProgressApiService implements IProgressService {
  async getProgressSummary(userId: string = 'user_default'): Promise<ProgressSummary> {
    try {
      const response: any = await apiClient.get(`/api/v1/progress?user_id=${userId}`);
      const fallback = await mockProgressService.getProgressSummary(userId);

      return {
        ...fallback,
        monthlyConsistency: response.monthly_consistency_pct || fallback.monthlyConsistency,
        exercise_rule_week: response.exercise_rule_week || fallback.exercise_rule_week,
        strength_variation_levels: response.strength_variation_levels || fallback.strength_variation_levels,
      };
    } catch {
      return mockProgressService.getProgressSummary(userId);
    }
  }

  async getProgress(userId?: string): Promise<ProgressSummary> {
    return this.getProgressSummary(userId);
  }
}

export const progressApiService = new ProgressApiService();
