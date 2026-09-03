import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { NumericInputWithUnit } from '../NumericInputWithUnit';

interface Step1AgeProps {
  age: string;
  onChangeAge: (age: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step1Age: React.FC<Step1AgeProps> = ({
  age,
  onChangeAge,
  onContinue,
  onSkip,
  onBack,
}) => {
  const ageNum = parseInt(age, 10);
  const isUnderage = age.length > 0 && !isNaN(ageNum) && ageNum < 18;
  const isValid = !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;

  return (
    <QuizLayout
      currentStep={1}
      question="How old are you?"
      helperText="Tell us your age so we can personalize your fitness and nutrition recommendations."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!isValid}
      showBackButton={false}
    >
      <NumericInputWithUnit
        value={age}
        onChangeText={onChangeAge}
        unit="years"
        placeholder="e.g. 28"
        maxLength={3}
        error={
          isUnderage
            ? "UniFit's current prototype is designed for adults aged 18 and above."
            : undefined
        }
        accessibilityLabel="Age in years"
        accessibilityHint="Enter your age in full years"
      />
    </QuizLayout>
  );
};
