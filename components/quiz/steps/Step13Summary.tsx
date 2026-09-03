import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../common/PrimaryButton';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Layout } from '../../../constants/layout';
import {
  QuizFormData,
  FitnessGoalOption,
  DietOption,
} from '../../../types/quiz';

interface Step13SummaryProps {
  formData: QuizFormData;
  onSubmit: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const Step13Summary: React.FC<Step13SummaryProps> = ({
  formData,
  onSubmit,
  onEdit,
  isSubmitting,
  errorMessage,
}) => {
  const formatGoal = (g: FitnessGoalOption | null) => {
    if (g === 'lose_fat') return 'Lose fat';
    if (g === 'maintain') return 'Maintain';
    if (g === 'muscle_gain') return 'Build muscle';
    return 'Not set';
  };

  const formatDiet = (d: DietOption | null) => {
    if (d === 'vegan') return 'Vegan';
    if (d === 'vegetarian') return 'Vegetarian';
    if (d === 'eggetarian') return 'Eggetarian';
    if (d === 'non_vegetarian') return 'Non-vegetarian';
    return 'Not set';
  };

  const formatActivities = () => {
    if (formData.user_activity_preferences.length === 0) return 'None';
    return formData.user_activity_preferences
      .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
      .join(', ');
  };

  const formatAccessibility = () => {
    if (
      formData.accessibility_needs.length === 0 ||
      formData.accessibility_needs.includes('none')
    ) {
      return 'Standard guidance';
    }
    return formData.accessibility_needs
      .map((need) => {
        if (need === 'blind_low_vision') return 'Audio & Spoken Reps';
        if (need === 'deaf_hard_of_hearing') return 'Visual & Captions';
        return 'Custom Adaptations';
      })
      .join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Feather name="check" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.heading}>Your UniFit profile is ready.</Text>
          <Text style={styles.subheading}>
            We'll use your preferences and goals to personalize your fitness journey.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={18} color={Colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Profile Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Goal</Text>
            <Text style={styles.value}>{formatGoal(formData.fitness_goal)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Activity</Text>
            <Text style={styles.value}>{formatActivities()}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Diet</Text>
            <Text style={styles.value}>{formatDiet(formData.diet)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Accessibility</Text>
            <Text style={styles.value}>{formatAccessibility()}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Experience</Text>
            <Text style={styles.value}>
              {formData.strength_experience === 'new'
                ? 'New to Strength'
                : formData.strength_experience === 'some_experience'
                ? 'Some Experience'
                : 'Regularly Train'}
            </Text>
          </View>
        </View>

        {/* Safety Disclaimer Banner */}
        {formData.has_exercise_restriction ? (
          <View style={styles.safetyBox}>
            <Feather name="shield" size={18} color={Colors.warning} style={{ marginRight: 8 }} />
            <Text style={styles.safetyText}>
              Safety Notice: The generated plan provides general fitness guidance and is not a substitute for professional medical advice.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onEdit}
          style={styles.editButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Review and edit answers"
        >
          <Feather name="edit-2" size={15} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.editText}>Review / Edit Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Create My Plan"
          onPress={onSubmit}
          isLoading={isSubmitting}
          accessibilityLabel="Create My Plan"
          accessibilityHint="Saves your completed profile and launches your personalized dashboard"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  heading: {
    ...Typography.h1,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
    fontSize: 26,
  },
  subheading: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Layout.spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBackground,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    width: '100%',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs + 2,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Layout.spacing.xs,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    width: '100%',
  },
  safetyText: {
    ...Typography.bodySmall,
    color: Colors.warning,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  editText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Layout.shadows.subtle,
  },
});
