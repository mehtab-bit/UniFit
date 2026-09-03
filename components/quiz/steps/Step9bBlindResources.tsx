import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { QuizLayout } from '../QuizLayout';
import { SelectableCard } from '../SelectableCard';
import { BlindLowVisionResourceOption } from '../../../types/quiz';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Layout } from '../../../constants/layout';

interface Step9bBlindResourcesProps {
  selectedResources: BlindLowVisionResourceOption[];
  onToggleResource: (resource: BlindLowVisionResourceOption) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const RESOURCE_OPTIONS: {
  value: BlindLowVisionResourceOption;
  label: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  {
    value: 'safe_indoor_space',
    label: 'Clear familiar indoor workout space',
    desc: 'A safe, clutter-free area at home or a familiar indoor environment.',
    icon: 'home',
  },
  {
    value: 'stable_support',
    label: 'Stable chair, wall, or support',
    desc: 'Something sturdy to hold onto for balance during standing exercises.',
    icon: 'anchor',
  },
  {
    value: 'guide',
    label: 'Exercise partner or guide',
    desc: 'A person who can assist, describe, or guide during workouts.',
    icon: 'users',
  },
  {
    value: 'stationary_bike',
    label: 'Stationary exercise bike',
    desc: 'A fixed cycle for safe, guided cardio without navigation challenges.',
    icon: 'activity',
  },
  {
    value: 'accessible_pool_support',
    label: 'Accessible pool with support',
    desc: 'A swimming facility with lane ropes, poolside rails, and staff support.',
    icon: 'droplet',
  },
];

export const Step9bBlindResources: React.FC<Step9bBlindResourcesProps> = ({
  selectedResources,
  onToggleResource,
  onContinue,
  onSkip,
  onBack,
}) => {
  return (
    <QuizLayout
      currentStep={9}
      question="What accessible workout resources do you have?"
      helperText="Select everything available to you. UniFit will tailor your exercises to what's safe and practical with these resources."
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      isContinueDisabled={false}
    >
      {/* Context note */}
      <View
        style={styles.contextNote}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Follow-up for blind or low vision users. This helps us recommend exercises that are safe, practical, and comfortable for you."
      >
        <Feather
          name="info"
          size={16}
          color={Colors.primary}
          style={styles.noteIcon}
          accessible={false}
          importantForAccessibility="no"
        />
        <Text style={styles.noteText}>
          This helps us recommend exercises that are safe and comfortable for you.
        </Text>
      </View>

      {/* Resource Checkboxes */}
      <View
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Accessible workout resource options. Select all that apply."
      >
        {RESOURCE_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            description={opt.desc}
            iconName={opt.icon}
            isMultiSelect={true}
            selected={selectedResources.includes(opt.value)}
            onSelect={() => onToggleResource(opt.value)}
          />
        ))}
      </View>
    </QuizLayout>
  );
};

const styles = StyleSheet.create({
  contextNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  noteIcon: {
    marginRight: Layout.spacing.sm,
    marginTop: 1,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.dark,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
});
