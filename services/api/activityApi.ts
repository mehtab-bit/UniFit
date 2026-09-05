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
    const hasDuration = raw.duration_minutes != null;
    const hasDistance = raw.distance_km != null;
    return {
      id: raw.id || `session-${created?.getTime?.() ?? Date.now()}`,
      title: isStrength ? 'Full Body Strength Session' : 'Workout Session',
      type: (isStrength ? 'strength' : raw.activity_id || 'strength') as any,
      activity_id: raw.activity_id,
      requested_activity_id: raw.requested_activity_id,
      progression_key: raw.progression_key,
      session_type: raw.session_type,
      duration: hasDuration ? `${raw.duration_minutes} min` : 'Duration not recorded',
      durationMinutes: hasDuration ? Number(raw.duration_minutes) : null,
      distance: hasDistance ? `${raw.distance_km} km` : undefined,
      distanceKm: hasDistance ? Number(raw.distance_km) : null,
      // Calorie estimates are intentionally absent: no measured or documented
      // method exists yet, so inventing duration×7 is forbidden.
      calories: 'Unavailable',
      caloriesNum: null,
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
    const response: any = await apiClient.get(`/api/v1/sessions?user_id=${userId}`);
    const sessions = (response?.sessions || [])
      .map((s: any) => this.mapSession(s))
      .filter((s: ActivitySession | null): s is ActivitySession => s !== null);
    return sessions;
  }

  async getWeeklySummary(userId: string = 'user_default'): Promise<ActivitySummary> {
    const sessions = await this.getRecentSessions(userId);
    const minutes = sessions
      .map((s) => s.durationMinutes)
      .filter((value): value is number => value != null);
    const totalMinutes = minutes.reduce((acc, value) => acc + value, 0);
    const totalDistance = sessions
      .map((s) => s.distanceKm)
      .filter((value): value is number => value != null)
      .reduce((acc, value) => acc + value, 0);
    return {
      sessionsCount: sessions.length,
      activeMinutes: minutes.length > 0 ? totalMinutes : null,
      activeCalories: null,
      totalDistanceKm:
        sessions.some((s) => s.distanceKm != null)
          ? Math.round(totalDistance * 10) / 10
          : null,
    };
  }
}

export const activityApiService = new ActivityApiService();
