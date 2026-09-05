/**
 * Single entry point for the engine's combined weekly plan
 * (workouts + nutrition + meals in one response).
 *
 * Plans are generated from the committed server profile and identified by
 * user + week start + profile/progression revisions. This module is the
 * shared client-side plan store: every plan-derived screen asks through it so
 * they cannot drift apart or regenerate independently.
 */

import { apiClient } from './apiClient';
import { ProfileService } from '../../lib/profile';

export interface CombinedWeekOptions {
  weekNumber?: number;
  weekStartDate?: string;
  force?: boolean;
}

interface PlanStoreEntry {
  promise: Promise<any>;
  generation: number;
}

const store = new Map<string, PlanStoreEntry>();

function localMonday(date?: Date): string {
  const d = date || new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function cacheKey(userId: string, weekStartDate?: string): string {
  return `${userId}:${weekStartDate || localMonday()}`;
}

export function fetchCombinedWeek(
  userId: string = 'user_default',
  options: CombinedWeekOptions = {}
): Promise<any> {
  const key = cacheKey(userId, options.weekStartDate);
  const generation = (store.get(key)?.generation || 0) + 1;

  if (options.force) {
    store.delete(key);
  }

  const existing = store.get(key);
  if (existing) {
    return existing.promise;
  }

  const promise = (async () => {
    try {
      const engine = await ProfileService.resolveEngineRequest(userId);
      const response = await apiClient.post('/api/v1/fitness/weekly-plan', {
        week_start_date: options.weekStartDate || localMonday(),
        week_number: options.weekNumber,
        use_server_profile: true,
        expected_profile_revision: engine.profile_revision,
        force_regenerate: Boolean(options.force),
      });
      return response;
    } catch (err) {
      // Never leave a failed promise cached: the next caller retries instead
      // of replaying a one-off failure forever.
      const current = store.get(key);
      if (current && current.generation === generation) {
        store.delete(key);
      }
      throw err;
    }
  })();

  store.set(key, { promise, generation });
  return promise;
}

/** Clears every cached plan for one user after a profile/session change. */
export function clearCombinedWeek(userId: string) {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(`${userId}:`)) {
      store.delete(key);
    }
  }
}

/**
 * Picks a day entry from a backend week array. Prefers the explicit local date
 * that every scheduled plan day now carries; falls back to day-name lookup.
 */
export function pickDayFromWeek(days: any[] | undefined, date?: string): any {
  const list = days || [];
  if (!list.length) return undefined;
  if (date) {
    const byDate = list.find((d) => String(d.local_date || '') === date);
    if (byDate) return byDate;
    const dow = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      new Date(date).getDay()
    ];
    return list.find((d) => String(d.day || '').toLowerCase() === dow) || list[0];
  }
  const today = localMonday();
  const todayDate = new Date();
  const byToday = list.find(
    (d) => String(d.local_date || '') === localDateString(todayDate)
  );
  return byToday || list[0];
}
