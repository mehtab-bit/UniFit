/**
 * W09 authenticated activity-log API client.
 */

import { apiClient } from './apiClient';
import { ActivityLog, ActivityType } from '../../types/domain';

export interface ActivityLogInput {
  activity_type: ActivityType;
  local_date: string;
  source: 'guided' | 'manual';
  operation_id?: string;
  started_at?: string;
  ended_at?: string;
  active_duration_seconds?: number;
  duration_minutes?: number;
  distance_km?: number;
  distance_entered?: boolean;
  completed?: boolean;
  notes?: string;
}

function mapRow(row: Record<string, any>): ActivityLog {
  return {
    id: row.id,
    user_id: row.user_id,
    activity_type: row.activity_type,
    local_date: row.local_date,
    source: row.source,
    operation_id: row.operation_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    active_duration_seconds:
      row.active_duration_seconds != null
        ? Number(row.active_duration_seconds)
        : null,
    duration_minutes:
      row.duration_minutes != null ? Number(row.duration_minutes) : null,
    distance_km: row.distance_km != null ? Number(row.distance_km) : null,
    distance_entered: Boolean(row.distance_entered),
    completed: Boolean(row.completed),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class ActivityLogApiService {
  async list(localDate?: string): Promise<ActivityLog[]> {
    const suffix = localDate ? `?local_date=${encodeURIComponent(localDate)}` : '';
    const rows = await apiClient.get<Record<string, any>[]>(
      `/api/v1/activity/logs${suffix}`
    );
    return (rows || []).map(mapRow);
  }

  async create(input: ActivityLogInput): Promise<ActivityLog> {
    const row = await apiClient.post<Record<string, any>>('/api/v1/activity/logs', {
      activity_type: input.activity_type,
      local_date: input.local_date,
      source: input.source,
      operation_id: input.operation_id || undefined,
      started_at: input.started_at,
      ended_at: input.ended_at,
      active_duration_seconds: input.active_duration_seconds,
      duration_minutes: input.duration_minutes,
      distance_km: input.distance_km,
      distance_entered: Boolean(input.distance_entered),
      completed: Boolean(input.completed),
      notes: input.notes,
    });
    return mapRow(row);
  }
}

export const activityLogApiService = new ActivityLogApiService();
