import { IProgressService } from '../types';
import { ProgressSummary } from '../../types/domain';

const DEFAULT_PROGRESS: ProgressSummary = {
  workoutsCompleted: 10,
  weeklyConsistency: 100,
  monthlyConsistency: 83,
  currentStreak: 5,
  bestStreak: 12,
  totalActiveMinutes: 245,
  adherenceScore: 100,
  phaseTitle: 'Week 1 • Phase 1 Calibration',
  // Engine progression parameters (managed strictly by backend)
  activity_rule_week: 1,
  exercise_rule_week: {
    squat: 1,
    lunge: 1,
    pushup: 1,
    bicep_curl: 1,
    supported_row: 1,
  },
  strength_variation_levels: {
    squat: 'chair',
    lunge: 'supported',
    pushup: 'incline',
    bicep_curl: 'band_standing',
    supported_row: 'supported_doorframe',
  },
  milestones: [
    {
      id: 'm-1',
      title: '8-Week Plan Onboarding Completed',
      date: 'Today',
      status: 'Completed',
      icon: 'check-circle',
    },
    {
      id: 'm-2',
      title: 'First Guided Workout Session',
      date: 'Upcoming',
      status: 'Ready',
      icon: 'play-circle',
    },
    {
      id: 'm-3',
      title: 'Weekly Volume Consistency Badge',
      date: 'Week 1',
      status: 'In Progress',
      icon: 'award',
    },
  ],
};

export class MockProgressService implements IProgressService {
  async getProgressSummary(_userId?: string): Promise<ProgressSummary> {
    return { ...DEFAULT_PROGRESS };
  }

  async getProgress(userId?: string): Promise<ProgressSummary> {
    return this.getProgressSummary(userId);
  }
}

export const mockProgressService = new MockProgressService();
