/**
 * API-backed implementation of IProgressService.
 */

import { IProgressService } from '../types';
import { ProgressSummary } from '../../types/domain';
import { apiClient } from './apiClient';

export class ProgressApiService implements IProgressService {
  async getProgressSummary(userId: string = 'user_default'): Promise<ProgressSummary> {
    const [response, streakResponse]: any[] = await Promise.all([
      apiClient.get(`/api/v1/progress?user_id=${userId}`),
      apiClient.get(`/api/v1/streak?user_id=${userId}`)
    ]);
    return {
      workoutsCompleted: response.logged_sessions_count || 0,
      weeklyConsistency: streakResponse.weekly_adherence_pct || 0,
      monthlyConsistency: response.monthly_consistency_pct || 0,
      currentStreak: streakResponse.current_streak || 0,
      bestStreak: streakResponse.best_streak || 0,
      totalActiveMinutes: 0,
      adherenceScore: response.monthly_consistency_pct || 0,
      phaseTitle: `Week ${response.current_week || 1} • Phase ${response.current_week || 1}`,
      milestones: response.milestones || [],
      activity_rule_week: response.activity_rule_week,
      exercise_rule_week: response.exercise_rule_week,
      strength_variation_levels: response.strength_variation_levels,
    };
  }

  async getProgress(userId?: string): Promise<ProgressSummary> {
    return this.getProgressSummary(userId);
  }
}

export const progressApiService = new ProgressApiService();
