import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { TextInput } from '../../common/TextInput';
import { StrengthEquipmentOption } from '../../../types/quiz';

interface Step11EquipmentProps {
  selectedEquipment: StrengthEquipmentOption[];
  otherEquipment: string;
  onToggleEquipment: (equipment: StrengthEquipmentOption) => void;
  onChangeOtherEquipment: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step11Equipment: React.FC<Step11EquipmentProps> = ({
  selectedEquipment,
  otherEquipment,
  onToggleEquipment,
  onChangeOtherEquipment,
  onContinue,
  onSkip,
  onBack,
}) => {
  const equipmentList: {
    label: string;
    value: StrengthEquipmentOption;
    desc?: string;
  }[] = [
    {
      label: 'No equipment',
      value: 'no_equipment',
      desc: 'Bodyweight-only strength movements.',
    },
    {
      label: 'Dumbbells',
      value: 'dumbbells',
      desc: 'Adjustable or fixed weight dumbbells.',
    },
    {
      label: 'Resistance bands',
      value: 'resistance_bands',
      desc: 'Loop or handle elastic resistance bands.',
    },
    {
      label: 'Household weights',
      value: 'household_weights',
      desc: 'Water bottles, backpack, or similar household items.',
    },
    {
      label: 'Other',
      value: 'other',
      desc: 'Barbells, kettlebells, or gym machines.',
    },
  ];

  const isOtherSelected = selectedEquipment.includes('other');

  return (
    <QuizLayout
      currentStep={11}
      question="What equipment do you have available for strength training?"
      helperText="Select all the equipment you can regularly use."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={selectedEquipment.length === 0}
    >
      {equipmentList.map((eq) => (
        <SelectableCard
          key={eq.value}
          title={eq.label}
          description={eq.desc}
          isMultiSelect={true}
          selected={selectedEquipment.includes(eq.value)}
          onSelect={() => onToggleEquipment(eq.value)}
        />
      ))}

      {isOtherSelected ? (
        <View style={styles.additionalContainer}>
          <TextInput
            label="What equipment do you have?"
            placeholder="e.g. Kettlebells, pull-up bar"
            value={otherEquipment}
            onChangeText={onChangeOtherEquipment}
            accessibilityHint="Describe your available equipment"
          />
        </View>
      ) : null}
    </QuizLayout>
  );
};

const styles = StyleSheet.create({
  additionalContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
});
