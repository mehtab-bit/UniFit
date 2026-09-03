import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { TextInput } from '../../common/TextInput';

interface Step10SafetyProps {
  hasRestriction: boolean | null;
  description: string;
  onSelectHasRestriction: (hasRestriction: boolean) => void;
  onChangeDescription: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step10Safety: React.FC<Step10SafetyProps> = ({
  hasRestriction,
  description,
  onSelectHasRestriction,
  onChangeDescription,
  onContinue,
  onSkip,
  onBack,
}) => {
  return (
    <QuizLayout
      currentStep={10}
      question="Do you currently have any injury, pain, or professional restriction that affects exercise?"
      helperText="This information helps ensure safe movement selection. (This is a safety flag, not a medical diagnosis)."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={hasRestriction === null}
    >
      <SelectableCard
        title="No"
        description="I have no known physical limitations or restrictions."
        iconName="check-circle"
        selected={hasRestriction === false}
        onSelect={() => onSelectHasRestriction(false)}
      />
      <SelectableCard
        title="Yes"
        description="I have an injury, joint pain, or medical restriction."
        iconName="alert-triangle"
        selected={hasRestriction === true}
        onSelect={() => onSelectHasRestriction(true)}
      />

      {hasRestriction === true ? (
        <View style={styles.additionalContainer}>
          <TextInput
            label="Please briefly describe it (optional):"
            placeholder="Example: Previous knee injury, lower back tightness"
            value={description}
            onChangeText={onChangeDescription}
            accessibilityHint="Brief description of physical restriction"
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
