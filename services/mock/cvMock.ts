import { ICVService } from '../types';
import { CVFeedback, Exercise } from '../../types/domain';
import { ENGINE_EXERCISES } from './workoutMock';

const CORRECTIONS: Record<string, string[]> = {
  'Chair Squat': [
    'Keep your knees tracking directly over your toes.',
    'Maintain an upright chest and straight spine.',
    'Touch the chair lightly without fully relaxing tension.',
    'Drive through both heels as you rise to stand.',
  ],
  'Supported Reverse Lunge': [
    'Keep your front knee stacked directly above your ankle.',
    'Lower your back knee smoothly without slamming the floor.',
    'Maintain a vertical torso and grip support lightly for balance.',
    'Press through the front heel to return to starting stance.',
  ],
  'Wall Push-Up': [
    'Keep your core braced so hips do not sag.',
    'Elbows tracking at 45 degrees relative to ribs.',
    'Full range of motion: chest to wall, full lockout at top.',
    'Keep neck in neutral alignment looking at hand level.',
  ],
  'Incline Wall / Counter Push-Up': [
    'Keep your core braced so hips do not sag.',
    'Elbows tracking at 45 degrees relative to ribs.',
    'Full range of motion: chest to surface, full lockout at top.',
    'Keep neck in neutral alignment looking at hand level.',
  ],
  'Light Bottle Bicep Curl': [
    'Keep elbows pinned firmly to your ribcage.',
    'Squeeze biceps at the top contraction.',
    'Lower the weight with a controlled 2-second tempo.',
    'Avoid swinging your hips or upper torso.',
  ],
  'Light Supported One-Arm Row': [
    'Keep your back flat and support hand firmly planted.',
    'Drive your elbow back past your ribs.',
    'Squeeze your shoulder blade at the peak.',
    'Lower with steady control without twisting torso.',
  ],
  default: [
    'Maintain steady rhythmic breathing.',
    'Focus on controlled tempo and form.',
    'Great alignment! Keep this cadence.',
  ],
};

export class MockCVService implements ICVService {
  async getExerciseLibrary(): Promise<Exercise[]> {
    return ENGINE_EXERCISES;
  }

  async getFeedback(exerciseName: string, currentReps: number): Promise<CVFeedback> {
    const score = Math.max(90, Math.min(98, 92 + (currentReps % 4)));
    const correctionsList = CORRECTIONS[exerciseName] || CORRECTIONS.default;
    const hasCorrection = currentReps > 0 && currentReps % 3 === 0;
    const correction = hasCorrection ? correctionsList[currentReps % correctionsList.length] : undefined;
    const isCorrect = score >= 90;

    const baseMessage = `${exerciseName}. Repetition ${currentReps} counted. Form score ${score} percent.`;
    const feedbackMessage = correction ? `${baseMessage} Guidance: ${correction}` : baseMessage;

    return {
      exerciseId: `cv-${exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      exerciseName,
      reps: currentReps,
      formScore: score,
      correction,
      isCorrect,
      feedbackMessage,
      feedbackType: hasCorrection ? 'correction' : isCorrect ? 'success' : 'info',
    };
  }
}

export const mockCVService = new MockCVService();
