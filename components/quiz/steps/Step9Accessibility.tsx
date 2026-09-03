import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { TextInput } from '../../common/TextInput';
import { AccessibilityNeedOption } from '../../../types/quiz';

interface Step9AccessibilityProps {
  selectedNeeds: AccessibilityNeedOption[];
  otherDetails: string;
  onToggleNeed: (need: AccessibilityNeedOption) => void;
  onChangeOtherDetails: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step9Accessibility: React.FC<Step9AccessibilityProps> = ({
  selectedNeeds,
  otherDetails,
  onToggleNeed,
  onChangeOtherDetails,
  onContinue,
  onSkip,
  onBack,
}) => {
  const options: {
    label: string;
    value: AccessibilityNeedOption;
    desc: string;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    {
      label: 'Blind or low vision',
      value: 'blind_low_vision',
      desc: 'Enables spoken workout guidance, audio rep counts, and voice prompts.',
      icon: 'volume-2',
    },
    {
      label: 'Deaf or hard of hearing',
      value: 'deaf_hard_of_hearing',
      desc: 'Enables real-time captions, visual rep cues, and haptic feedback.',
      icon: 'eye',
    },
    {
      label: 'Other',
      value: 'other',
      desc: 'Custom accessibility adaptations.',
      icon: 'help-circle',
    },
    {
      label: 'None',
      value: 'none',
      desc: 'Standard visual and audio interface.',
      icon: 'check',
    },
  ];

  const isOtherSelected = selectedNeeds.includes('other');

  return (
    <QuizLayout
      currentStep={9}
      question="Do you have an accessibility need we should adapt the experience for?"
      helperText="Select all that apply. UniFit will adapt workout guidance and feedback to your needs."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={selectedNeeds.length === 0}
    >
      {options.map((opt) => (
        <SelectableCard
          key={opt.value}
          title={opt.label}
          description={opt.desc}
          iconName={opt.icon}
          isMultiSelect={true}
          selected={selectedNeeds.includes(opt.value)}
          onSelect={() => onToggleNeed(opt.value)}
        />
      ))}

      {isOtherSelected ? (
        <View style={styles.additionalContainer}>
          <TextInput
            label="What would help you most?"
            placeholder="e.g. Enlarged controls, high-contrast text"
            value={otherDetails}
            onChangeText={onChangeOtherDetails}
            accessibilityHint="Describe your custom accessibility preference"
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
