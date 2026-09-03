import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { SexOption } from '../../../types/quiz';

interface Step2SexProps {
  sex: SexOption | null;
  onSelectSex: (sex: SexOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step2Sex: React.FC<Step2SexProps> = ({
  sex,
  onSelectSex,
  onContinue,
  onSkip,
  onBack,
}) => {
  return (
    <QuizLayout
      currentStep={2}
      question="What is your sex?"
      helperText="This information helps us calculate your baseline energy needs."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!sex}
    >
      <SelectableCard
        title="Male"
        description="Biological male energy expenditure baseline"
        selected={sex === 'male'}
        onSelect={() => onSelectSex('male')}
      />
      <SelectableCard
        title="Female"
        description="Biological female energy expenditure baseline"
        selected={sex === 'female'}
        onSelect={() => onSelectSex('female')}
      />
    </QuizLayout>
  );
};
