import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { LifestyleActivityOption } from '../../../types/quiz';

interface Step6LifestyleProps {
  lifestyle: LifestyleActivityOption | null;
  onSelectLifestyle: (lifestyle: LifestyleActivityOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step6Lifestyle: React.FC<Step6LifestyleProps> = ({
  lifestyle,
  onSelectLifestyle,
  onContinue,
  onSkip,
  onBack,
}) => {
  const lifestyles: {
    label: string;
    value: LifestyleActivityOption;
    desc: string;
  }[] = [
    {
      label: 'Sedentary',
      value: 'sedentary',
      desc: 'Little to no daily physical activity; desk work routine.',
    },
    {
      label: 'Light',
      value: 'light',
      desc: 'Light activity, casual walks, standing for parts of the day.',
    },
    {
      label: 'Moderate',
      value: 'moderate',
      desc: 'Active day-to-day routine, moderate exercise 3–4 days/week.',
    },
    {
      label: 'Very Active',
      value: 'very_active',
      desc: 'High daily energy expenditure, physical work or daily intensive training.',
    },
  ];

  return (
    <QuizLayout
      currentStep={6}
      question="How would you describe your current lifestyle?"
      helperText="This helps us estimate your activity level and determine the starting intensity of your 8-week plan."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!lifestyle}
    >
      {lifestyles.map((l) => (
        <SelectableCard
          key={l.value}
          title={l.label}
          description={l.desc}
          selected={lifestyle === l.value}
          onSelect={() => onSelectLifestyle(l.value)}
        />
      ))}
    </QuizLayout>
  );
};
