import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { StrengthExperienceOption } from '../../../types/quiz';

interface Step12ExperienceProps {
  experience: StrengthExperienceOption | null;
  onSelectExperience: (experience: StrengthExperienceOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step12Experience: React.FC<Step12ExperienceProps> = ({
  experience,
  onSelectExperience,
  onContinue,
  onSkip,
  onBack,
}) => {
  const experiences: {
    label: string;
    value: StrengthExperienceOption;
    desc: string;
  }[] = [
    {
      label: 'New',
      value: 'new',
      desc: 'New to resistance training. Learn proper form and build foundational strength.',
    },
    {
      label: 'Some experience',
      value: 'some_experience',
      desc: 'Familiar with basic compound movements and bodyweight mechanics.',
    },
    {
      label: 'Regularly train',
      value: 'regularly_train',
      desc: 'Experienced with progressive resistance training and structured routines.',
    },
  ];

  return (
    <QuizLayout
      currentStep={12}
      question="How experienced are you with strength training?"
      helperText="This helps us choose a safe starting level."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!experience}
    >
      {experiences.map((exp) => (
        <SelectableCard
          key={exp.value}
          title={exp.label}
          description={exp.desc}
          selected={experience === exp.value}
          onSelect={() => onSelectExperience(exp.value)}
        />
      ))}
    </QuizLayout>
  );
};
