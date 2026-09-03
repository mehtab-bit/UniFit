import React from 'react';
import { Feather } from '@expo/vector-icons';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { FitnessGoalOption } from '../../../types/quiz';

interface Step5GoalProps {
  goal: FitnessGoalOption | null;
  onSelectGoal: (goal: FitnessGoalOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step5Goal: React.FC<Step5GoalProps> = ({
  goal,
  onSelectGoal,
  onContinue,
  onSkip,
  onBack,
}) => {
  const goals: {
    label: string;
    value: FitnessGoalOption;
    desc: string;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    {
      label: 'Lose fat',
      value: 'lose_fat',
      desc: 'Prioritize calorie deficit, fat oxidation, and metabolic conditioning.',
      icon: 'trending-down',
    },
    {
      label: 'Maintain',
      value: 'maintain',
      desc: 'Sustain current body composition, mobility, and cardiovascular health.',
      icon: 'activity',
    },
    {
      label: 'Build muscle',
      value: 'muscle_gain',
      desc: 'Hypertrophy-focused training with progressive resistance overload.',
      icon: 'trending-up',
    },
  ];

  return (
    <QuizLayout
      currentStep={5}
      question="What is your main fitness goal?"
      helperText="Choose the goal you want UniFit to prioritize."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!goal}
    >
      {goals.map((g) => (
        <SelectableCard
          key={g.value}
          title={g.label}
          description={g.desc}
          iconName={g.icon}
          selected={goal === g.value}
          onSelect={() => onSelectGoal(g.value)}
        />
      ))}
    </QuizLayout>
  );
};
