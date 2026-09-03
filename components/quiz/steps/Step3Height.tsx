import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { NumericInputWithUnit } from '../NumericInputWithUnit';

interface Step3HeightProps {
  heightCm: string;
  onChangeHeight: (height: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step3Height: React.FC<Step3HeightProps> = ({
  heightCm,
  onChangeHeight,
  onContinue,
  onSkip,
  onBack,
}) => {
  const heightNum = parseFloat(heightCm);
  const isInvalid =
    heightCm.length > 0 && !isNaN(heightNum) && (heightNum < 100 || heightNum > 250);
  const isValid = !isNaN(heightNum) && heightNum >= 100 && heightNum <= 250;

  return (
    <QuizLayout
      currentStep={3}
      question="What is your height?"
      helperText="We use your height together with your weight, age, and sex to estimate your baseline energy needs."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!isValid}
    >
      <NumericInputWithUnit
        value={heightCm}
        onChangeText={onChangeHeight}
        unit="cm"
        placeholder="e.g. 175"
        maxLength={4}
        error={isInvalid ? 'Please enter a valid height between 100 and 250 cm.' : undefined}
        accessibilityLabel="Height in centimeters"
        accessibilityHint="Enter your height in centimeters"
      />
    </QuizLayout>
  );
};
