import { IActivityService } from '../types';
import { ActivitySession, ActivitySummary } from '../../types/domain';

export const ENGINE_ACTIVITY_SESSIONS: ActivitySession[] = [
  {
    id: 'act-1',
    title: 'Full Body Strength Session',
    type: 'strength',
    activity_id: 'strength',
    progression_key: 'strength',
    session_type: 'full_body_base',
    duration: '25 min',
    durationMinutes: 25,
    calories: '180 kcal',
    caloriesNum: 180,
    intensity: 'moderate',
    icon: 'activity',
    color: '#2563EB',
    timestamp: 'Today, 8:00 AM',
  },
  {
    id: 'act-2',
    title: 'Morning Outdoor Walk',
    type: 'walking',
    activity_id: 'walking',
    progression_key: 'walking',
    duration: '32 min',
    durationMinutes: 32,
    distance: '2.4 km',
    distanceKm: 2.4,
    calories: '145 kcal',
    caloriesNum: 145,
    intensity: 'low',
    icon: 'compass',
    color: '#0284C7',
    timestamp: 'Yesterday, 7:15 AM',
  },
  {
    id: 'act-3',
    title: 'Run-Walk Session',
    type: 'running',
    activity_id: 'walking',
    requested_activity_id: 'running',
    progression_key: 'accessible_cardio',
    session_type: 'indoor_march',
    duration: '20 min',
    durationMinutes: 20,
    distance: '2.0 km',
    distanceKm: 2.0,
    calories: '190 kcal',
    caloriesNum: 190,
    intensity: 'interval',
    icon: 'zap',
    color: '#7C3AED',
    timestamp: 'Sep 24, 7:00 AM',
  },
  {
    id: 'act-4',
    title: 'Easy Cycling',
    type: 'cycling',
    activity_id: 'cycling',
    progression_key: 'cycling',
    duration: '30 min',
    durationMinutes: 30,
    distance: '8.0 km',
    distanceKm: 8.0,
    calories: '220 kcal',
    caloriesNum: 220,
    intensity: 'zone2',
    icon: 'repeat',
    color: '#059669',
    timestamp: 'Sep 23, 6:00 PM',
  },
  {
    id: 'act-5',
    title: 'Endurance Swim Session',
    type: 'swimming',
    activity_id: 'swimming',
    progression_key: 'swimming',
    duration: '40 min',
    durationMinutes: 40,
    distance: '1.2 km',
    distanceKm: 1.2,
    calories: '310 kcal',
    caloriesNum: 310,
    intensity: 'moderate',
    icon: 'droplet',
    color: '#0EA5E9',
    timestamp: 'Sep 22, 6:30 PM',
  },
];

export class MockActivityService implements IActivityService {
  async getRecentSessions(_userId?: string): Promise<ActivitySession[]> {
    return ENGINE_ACTIVITY_SESSIONS;
  }

  async getWeeklySummary(_userId?: string): Promise<ActivitySummary> {
    const totalMinutes = ENGINE_ACTIVITY_SESSIONS.reduce(
      (acc, s) => acc + (s.durationMinutes ?? 0),
      0
    );
    const totalCalories = ENGINE_ACTIVITY_SESSIONS.reduce(
      (acc, s) => acc + (s.caloriesNum ?? 0),
      0
    );
    const totalDistance = ENGINE_ACTIVITY_SESSIONS.reduce(
      (acc, s) => acc + (s.distanceKm || 0),
      0
    );
    return {
      sessionsCount: ENGINE_ACTIVITY_SESSIONS.length,
      activeMinutes: totalMinutes,
      activeCalories: totalCalories,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
    };
  }
}

export const mockActivityService = new MockActivityService();
