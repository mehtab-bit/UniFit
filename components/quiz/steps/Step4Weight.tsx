import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { NumericInputWithUnit } from '../NumericInputWithUnit';

interface Step4WeightProps {
  weightKg: string;
  onChangeWeight: (weight: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step4Weight: React.FC<Step4WeightProps> = ({
  weightKg,
  onChangeWeight,
  onContinue,
  onSkip,
  onBack,
}) => {
  const weightNum = parseFloat(weightKg);
  const isInvalid =
    weightKg.length > 0 && !isNaN(weightNum) && (weightNum < 30 || weightNum > 300);
  const isValid = !isNaN(weightNum) && weightNum >= 30 && weightNum <= 300;

  return (
    <QuizLayout
      currentStep={4}
      question="What is your current weight?"
      helperText="Your weight helps us personalize nutrition targets and workout recommendations."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!isValid}
    >
      <NumericInputWithUnit
        value={weightKg}
        onChangeText={onChangeWeight}
        unit="kg"
        placeholder="e.g. 70"
        maxLength={4}
        error={isInvalid ? 'Please enter a realistic weight between 30 and 300 kg.' : undefined}
        accessibilityLabel="Weight in kilograms"
        accessibilityHint="Enter your weight in kilograms"
      />
    </QuizLayout>
  );
};
