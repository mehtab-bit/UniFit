/**
 * API-backed implementation of IProgressService.
 */

import { IProgressService } from '../types';
import { ProgressSummary } from '../../types/domain';
import { apiClient } from './apiClient';

export class ProgressApiService implements IProgressService {
  async getProgressSummary(userId: string = 'user_default'): Promise<ProgressSummary> {
    try {
      const response: any = await apiClient.get(`/api/v1/progress?user_id=${userId}`);
      return {
        workoutsCompleted: response.logged_sessions_count || 0,
        weeklyConsistency: response.monthly_consistency_pct || 0,
        monthlyConsistency: response.monthly_consistency_pct || 0,
        currentStreak: 0,
        bestStreak: 0,
        totalActiveMinutes: 0,
        adherenceScore: response.monthly_consistency_pct || 0,
        phaseTitle: `Week ${response.current_week || 1} • Phase ${response.current_week || 1}`,
        milestones: [],
        activity_rule_week: response.activity_rule_week,
        exercise_rule_week: response.exercise_rule_week,
        strength_variation_levels: response.strength_variation_levels,
      };
    } catch (err) {
      console.warn('[ProgressApiService] Progress API error, returning empty progress:', err);
      return {
        workoutsCompleted: 0,
        weeklyConsistency: 0,
        monthlyConsistency: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalActiveMinutes: 0,
        adherenceScore: 0,
        phaseTitle: 'Week 1 • Phase 1',
        milestones: [],
      };
    }
  }

  async getProgress(userId?: string): Promise<ProgressSummary> {
    return this.getProgressSummary(userId);
  }
}

export const progressApiService = new ProgressApiService();
