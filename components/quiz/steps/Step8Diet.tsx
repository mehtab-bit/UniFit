import React from 'react';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { DietOption } from '../../../types/quiz';

interface Step8DietProps {
  diet: DietOption | null;
  onSelectDiet: (diet: DietOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step8Diet: React.FC<Step8DietProps> = ({
  diet,
  onSelectDiet,
  onContinue,
  onSkip,
  onBack,
}) => {
  const diets: { label: string; value: DietOption; desc: string }[] = [
    {
      label: 'Vegan',
      value: 'vegan',
      desc: '100% plant-based food without animal products or dairy.',
    },
    {
      label: 'Vegetarian',
      value: 'vegetarian',
      desc: 'Plant-based diet including dairy products, excluding meat and fish.',
    },
    {
      label: 'Eggetarian',
      value: 'eggetarian',
      desc: 'Vegetarian diet including eggs and dairy products.',
    },
    {
      label: 'Non-vegetarian',
      value: 'non_vegetarian',
      desc: 'All food groups including poultry, meat, seafood, dairy, and eggs.',
    },
  ];

  return (
    <QuizLayout
      currentStep={8}
      question="What is your food preference?"
      helperText="Your preference helps us filter meal recommendations."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={!diet}
    >
      {diets.map((d) => (
        <SelectableCard
          key={d.value}
          title={d.label}
          description={d.desc}
          selected={diet === d.value}
          onSelect={() => onSelectDiet(d.value)}
        />
      ))}
    </QuizLayout>
  );
};
