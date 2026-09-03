import React from 'react';
import { Feather } from '@expo/vector-icons';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { ActivityPreferenceOption } from '../../../types/quiz';

interface Step7ActivitiesProps {
  selectedActivities: ActivityPreferenceOption[];
  onToggleActivity: (activity: ActivityPreferenceOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step7Activities: React.FC<Step7ActivitiesProps> = ({
  selectedActivities,
  onToggleActivity,
  onContinue,
  onSkip,
  onBack,
}) => {
  const activities: {
    label: string;
    value: ActivityPreferenceOption;
    desc: string;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    {
      label: 'Walking',
      value: 'walking',
      desc: 'Outdoor or treadmill walking for baseline cardiovascular conditioning.',
      icon: 'compass',
    },
    {
      label: 'Running',
      value: 'running',
      desc: 'Jogging, interval pacing, or endurance running sessions.',
      icon: 'zap',
    },
    {
      label: 'Cycling',
      value: 'cycling',
      desc: 'Stationary spin or outdoor road cycling workouts.',
      icon: 'repeat',
    },
    {
      label: 'Swimming',
      value: 'swimming',
      desc: 'Low-impact full-body cardiovascular training.',
      icon: 'droplet',
    },
  ];

  return (
    <QuizLayout
      currentStep={7}
      question="Which activities do you enjoy or want in your plan?"
      helperText="Select all that apply. (Strength training is automatically included twice per week)."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={selectedActivities.length === 0}
    >
      {activities.map((act) => (
        <SelectableCard
          key={act.value}
          title={act.label}
          description={act.desc}
          iconName={act.icon}
          isMultiSelect={true}
          selected={selectedActivities.includes(act.value)}
          onSelect={() => onToggleActivity(act.value)}
        />
      ))}
    </QuizLayout>
  );
};
