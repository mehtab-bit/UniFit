/**
 * Single entry point for the engine's combined weekly plan
 * (workouts + nutrition + meals in one response).
 *
 * The backend caches the generated week per user, so the app asks once and
 * every screen derives its slice from the same combined plan. A per-user
 * in-memory cache avoids duplicate generation across parallel screen loads.
 */

import { apiClient } from './apiClient';
import { ProfileService } from '../../lib/profile';

const cache = new Map<string, Promise<any>>();

export function fetchCombinedWeek(
  userId: string = 'user_default',
  weekNumber: number = 1,
  force: boolean = false
): Promise<any> {
  const key = `${userId}:${weekNumber}`;
  if (force) {
    clearCombinedWeek(userId, weekNumber);
  }
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const engine = await ProfileService.resolveEngineRequest(userId);
        const response = await apiClient.post('/api/v1/fitness/weekly-plan', {
          user_id: userId,
          week_number: weekNumber,
          profile: engine.profile,
          activity_preferences: engine.activities,
          force_regenerate: !!force,
        });
        return response as any;
      })()
    );
  }
  return cache.get(key)!;
}

export function clearCombinedWeek(userId: string = 'user_default', weekNumber: number = 1) {
  cache.delete(`${userId}:${weekNumber}`);
}

/**
 * Picks today's (or the requested date's) entry from a backend week array whose
 * entries carry a `day` name (monday..sunday) and are indexed Monday-first.
 */
export function pickDayFromWeek(days: any[] | undefined, date?: string): any {
  const list = days || [];
  if (!list.length) return undefined;
  if (!date) return list[Math.min((new Date().getDay() + 6) % 7, list.length - 1)];
  const dow = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(date).getDay()];
  return list.find((d: any) => String(d.day || '').toLowerCase() === dow) || list[0];
}
