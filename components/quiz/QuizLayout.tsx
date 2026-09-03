import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { PrimaryButton } from '../common/PrimaryButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface QuizLayoutProps {
  currentStep: number;
  totalSteps?: number;
  question: string;
  helperText?: string;
  isOptional?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  isContinueDisabled?: boolean;
  isSubmitting?: boolean;
  continueButtonText?: string;
  showBackButton?: boolean;
  showSkipButton?: boolean;
  children: ReactNode;
}

export const QuizLayout: React.FC<QuizLayoutProps> = ({
  currentStep,
  totalSteps = 12,
  question,
  helperText,
  isOptional = false,
  onBack,
  onContinue,
  onSkip,
  isContinueDisabled = false,
  isSubmitting = false,
  continueButtonText = 'Continue',
  showBackButton = true,
  showSkipButton = true,
  children,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            {showBackButton ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onBack}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to previous question"
                accessibilityHint="Navigates to the preceding step"
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="arrow-left" size={20} color={Colors.text} accessible={false} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}

            <View style={styles.rightHeaderActions}>
              {isOptional ? (
                <View
                  style={styles.optionalBadge}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel="Optional question"
                >
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              ) : null}

              {showSkipButton && onSkip ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onSkip}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this question"
                  accessibilityHint="Bypasses this question and proceeds to the next step"
                  style={styles.skipButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.skipText}>Skip</Text>
                  <Feather name="chevron-right" size={16} color={Colors.textSecondary} style={{ marginLeft: 2 }} accessible={false} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Progress Indicator */}
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </View>

        {/* Scrollable Center Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.questionSection}>
            <Text
              style={styles.questionTitle}
              accessible={true}
              accessibilityRole="header"
            >
              {question}
            </Text>
            {helperText ? (
              <Text style={styles.helperText} accessible={true} accessibilityRole="text">
                {helperText}
              </Text>
            ) : null}
          </View>

          <View style={styles.controlsSection}>{children}</View>
        </ScrollView>

        {/* Bottom Sticky Action Footer */}
        <View style={styles.footerContainer}>
          <PrimaryButton
            title={continueButtonText}
            onPress={onContinue}
            disabled={isContinueDisabled}
            isLoading={isSubmitting}
            accessibilityLabel={continueButtonText}
            accessibilityHint="Saves your answer and moves to the next question"
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xs,
    minHeight: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
    minHeight: 44,
    minWidth: 44,
  },
  backText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  headerSpacer: {
    width: 60,
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionalBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: Layout.spacing.xs - 2,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Layout.spacing.sm,
  },
  optionalText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs + 2,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  skipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  questionSection: {
    marginBottom: Layout.spacing.xl,
  },
  questionTitle: {
    ...Typography.h1,
    color: Colors.dark,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: Layout.spacing.sm,
  },
  helperText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  controlsSection: {
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  continueButton: {
    width: '100%',
  },
});
