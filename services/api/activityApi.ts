/**
 * API-backed implementation of IActivityService.
 */

import { IActivityService } from '../types';
import { ActivitySession, ActivitySummary } from '../../types/domain';
import { apiClient } from './apiClient';

export class ActivityApiService implements IActivityService {
  private mapSession(raw: any): ActivitySession | null {
    const created = raw.created_at ? new Date(raw.created_at) : null;
    const isStrength = (raw.activity_id || raw.progression_key || '') === 'strength';
    return {
      id: raw.id || `session-${created?.getTime?.() ?? Date.now()}`,
      title: isStrength ? 'Full Body Strength Session' : 'Workout Session',
      type: (isStrength ? 'strength' : raw.activity_id || 'strength') as any,
      activity_id: raw.activity_id,
      progression_key: raw.progression_key,
      session_type: raw.session_type,
      duration: `${raw.duration_minutes || 25} min`,
      durationMinutes: raw.duration_minutes || 25,
      calories: `${Math.round((raw.duration_minutes || 25) * 7)} kcal`,
      caloriesNum: Math.round((raw.duration_minutes || 25) * 7),
      intensity: 'moderate' as any,
      icon: isStrength ? 'dumbbell' : 'activity',
      color: isStrength ? '#2563EB' : '#0284C7',
      timestamp: created
        ? created.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Recently',
    };
  }

  async getRecentSessions(userId: string = 'user_default'): Promise<ActivitySession[]> {
    try {
      const response: any = await apiClient.get(`/api/v1/sessions?user_id=${userId}`);
      const sessions = (response?.sessions || [])
        .map((s: any) => this.mapSession(s))
        .filter((s: ActivitySession | null): s is ActivitySession => s !== null);
      return sessions;
    } catch (err) {
      console.warn('[ActivityApiService] Sessions API error, returning empty list:', err);
      return [];
    }
  }

  async getWeeklySummary(userId: string = 'user_default'): Promise<ActivitySummary> {
    try {
      const sessions = await this.getRecentSessions(userId);
      const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      const totalCalories = sessions.reduce((acc, s) => acc + s.caloriesNum, 0);
      const totalDistance = sessions.reduce((acc, s) => acc + (s.distanceKm || 0), 0);
      return {
        sessionsCount: sessions.length,
        activeMinutes: totalMinutes,
        activeCalories: totalCalories,
        totalDistanceKm: Math.round(totalDistance * 10) / 10,
      };
    } catch {
      return { sessionsCount: 0, activeMinutes: 0, activeCalories: 0 };
    }
  }
}

export const activityApiService = new ActivityApiService();
