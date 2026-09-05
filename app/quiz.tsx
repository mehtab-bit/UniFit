import React, { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useScreenAnnouncement } from '../hooks/useScreenAnnouncement';
import { ProfileService } from '../lib/profile';
import { Step0Intro } from '../components/quiz/steps/Step0Intro';
import { Step1Age } from '../components/quiz/steps/Step1Age';
import { Step2Sex } from '../components/quiz/steps/Step2Sex';
import { Step3Height } from '../components/quiz/steps/Step3Height';
import { Step4Weight } from '../components/quiz/steps/Step4Weight';
import { Step5Goal } from '../components/quiz/steps/Step5Goal';
import { Step6Lifestyle } from '../components/quiz/steps/Step6Lifestyle';
import { Step7Activities } from '../components/quiz/steps/Step7Activities';
import { Step8Diet } from '../components/quiz/steps/Step8Diet';
import { Step9Accessibility } from '../components/quiz/steps/Step9Accessibility';
import { Step9bBlindResources } from '../components/quiz/steps/Step9bBlindResources';
import { Step10Safety } from '../components/quiz/steps/Step10Safety';
import { Step11Equipment } from '../components/quiz/steps/Step11Equipment';
import { Step12Experience } from '../components/quiz/steps/Step12Experience';
import { Step13Summary } from '../components/quiz/steps/Step13Summary';
import {
  QuizFormData,
  ActivityPreferenceOption,
  AccessibilityNeedOption,
  BlindLowVisionResourceOption,
  StrengthEquipmentOption,
  UserProfile,
} from '../types/quiz';

const INITIAL_FORM_DATA: QuizFormData = {
  age: '',
  sex: null,
  height_cm: '',
  weight_kg: '',
  fitness_goal: null,
  lifestyle_activity: null,
  user_activity_preferences: [],
  diet: null,
  accessibility_needs: [],
  accessibility_other_details: '',
  blind_low_vision_resources: [],
  has_exercise_restriction: null,
  exercise_restriction_description: '',
  strength_equipment: [],
  strength_equipment_other: '',
  strength_experience: null,
};

function quizFromProfile(profile: UserProfile): QuizFormData {
  const preferred =
    profile.preferred_activities || profile.user_activity_preferences || [];
  return {
    age: profile.age != null ? String(profile.age) : '',
    sex: profile.sex,
    height_cm: profile.height_cm != null ? String(profile.height_cm) : '',
    weight_kg: profile.weight_kg != null ? String(profile.weight_kg) : '',
    fitness_goal: profile.fitness_goal,
    lifestyle_activity: profile.lifestyle_activity,
    user_activity_preferences: [...preferred],
    diet: profile.diet,
    accessibility_needs: [...(profile.accessibility_needs || [])],
    accessibility_other_details: profile.accessibility_other_details || '',
    blind_low_vision_resources: [
      ...(profile.blind_low_vision_resources || []),
    ],
    has_exercise_restriction:
      profile.has_exercise_restriction == null
        ? null
        : profile.has_exercise_restriction,
    exercise_restriction_description:
      profile.exercise_restriction_description || '',
    strength_equipment: [...(profile.strength_equipment || [])],
    strength_equipment_other: profile.strength_equipment_other || '',
    strength_experience: profile.strength_experience,
  };
}

export default function QuizScreen() {
  const router = useRouter();
  const { user, profile, submitQuizProfile, refreshProfile } = useAuth();

  useScreenAnnouncement('Personalized assessment. Answer 12 questions to customize your plan.');

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuizFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore saved quiz draft on mount if available
  useEffect(() => {
    const restoreDraft = async () => {
      if (user) {
        const draft = await ProfileService.getQuizDraft(user.id);
        if (draft) {
          setFormData(draft.data);
          if (draft.step >= 0 && draft.step <= 13) {
            setCurrentStep(draft.step);
          }
        } else if (profile?.onboarding_completed) {
          setFormData(quizFromProfile(profile));
        }
      }
    };
    restoreDraft();
  }, [user, profile]);

  const updateFormData = (updater: (prev: QuizFormData) => QuizFormData) => {
    setFormData((prev) => {
      const next = updater(prev);
      if (user) {
        ProfileService.saveQuizDraft(user.id, currentStep, next);
      }
      return next;
    });
    setErrorMessage(null);
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    if (nextStep >= 1 && nextStep <= 12) {
      AccessibilityInfo.announceForAccessibility(`Step ${nextStep} of 12.`);
    } else if (nextStep === 13) {
      AccessibilityInfo.announceForAccessibility('Assessment completed. Review your plan blueprint.');
    }
    if (user) {
      ProfileService.saveQuizDraft(user.id, nextStep, formData);
    }
  };

  const handlePrevStep = async () => {
    setErrorMessage(null);
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (prevStep >= 1) {
        AccessibilityInfo.announceForAccessibility(`Step ${prevStep} of 12.`);
      }
      if (user) {
        ProfileService.saveQuizDraft(user.id, prevStep, formData);
      }
    } else {
      if (user && profile?.onboarding_completed) {
        // Cancelling a retake must restore the committed profile/plan. The
        // quiz draft is discarded so a future retake starts from the profile.
        await ProfileService.clearQuizDraft(user.id);
        try {
          await refreshProfile();
        } catch {
          // Profile state stays as-is; navigation below still returns home.
        }
      }
      router.replace('/(app)');
    }
  };

  const handleSkipAll = async () => {
    await handleSubmitProfile();
  };

  const handleSubmitProfile = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitQuizProfile(formData);
      if (result.success) {
        router.replace('/(app)');
      } else {
        const err = result.error || 'Unable to save profile. Please try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch (err) {
      const netErr = 'A network error occurred. Please try again.';
      setErrorMessage(netErr);
      AccessibilityInfo.announceForAccessibility(netErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivity = (activity: ActivityPreferenceOption) => {
    updateFormData((prev) => {
      const exists = prev.user_activity_preferences.includes(activity);
      const updated = exists
        ? prev.user_activity_preferences.filter((item) => item !== activity)
        : [...prev.user_activity_preferences, activity];
      return { ...prev, user_activity_preferences: updated };
    });
  };

  const handleToggleAccessibility = (need: AccessibilityNeedOption) => {
    updateFormData((prev) => {
      if (need === 'none') {
        return { ...prev, accessibility_needs: ['none'], accessibility_other_details: '' };
      }

      const filtered = prev.accessibility_needs.filter((item) => item !== 'none');
      const exists = filtered.includes(need);
      const updated = exists ? filtered.filter((item) => item !== need) : [...filtered, need];

      return {
        ...prev,
        accessibility_needs: updated.length === 0 ? [] : updated,
      };
    });
  };

  const handleToggleEquipment = (eq: StrengthEquipmentOption) => {
    updateFormData((prev) => {
      if (eq === 'no_equipment') {
        return { ...prev, strength_equipment: ['no_equipment'], strength_equipment_other: '' };
      }

      const filtered = prev.strength_equipment.filter((item) => item !== 'no_equipment');
      const exists = filtered.includes(eq);
      const updated = exists ? filtered.filter((item) => item !== eq) : [...filtered, eq];

      return {
        ...prev,
        strength_equipment: updated.length === 0 ? [] : updated,
      };
    });
  };

  const handleToggleBlindResource = (resource: BlindLowVisionResourceOption) => {
    updateFormData((prev) => {
      const exists = prev.blind_low_vision_resources.includes(resource);
      const updated = exists
        ? prev.blind_low_vision_resources.filter((item) => item !== resource)
        : [...prev.blind_low_vision_resources, resource];
      return { ...prev, blind_low_vision_resources: updated };
    });
  };

  // Whether to show the blind/low vision follow-up step (step 9b)
  const isBlindLowVisionSelected = formData.accessibility_needs.includes('blind_low_vision');

  // Compute effective step to render — step 9b is a sub-step after step 9
  // We encode it as "step 9 with a sub-step" using a boolean flag
  const [showBlindFollowUp, setShowBlindFollowUp] = React.useState(false);

  // Override navigation so that after step 9 (accessibility), if blind/low vision
  // is selected, we show step 9b before advancing to step 10.
  const handleStep9Continue = () => {
    if (isBlindLowVisionSelected) {
      setShowBlindFollowUp(true);
      AccessibilityInfo.announceForAccessibility(
        'Follow-up question: What accessible workout resources do you have?'
      );
    } else {
      setShowBlindFollowUp(false);
      handleNextStep();
    }
  };

  const handleStep9bBack = () => {
    setShowBlindFollowUp(false);
    AccessibilityInfo.announceForAccessibility('Step 9 of 12. Accessibility needs.');
  };

  const handleStep9bContinue = () => {
    setShowBlindFollowUp(false);
    handleNextStep();
  };

  switch (currentStep) {
    case 0:
      return (
        <Step0Intro
          userName={user?.fullName || 'Athlete'}
          onStart={handleNextStep}
          onSkipAll={handleSkipAll}
        />
      );
    case 1:
      return (
        <Step1Age
          age={formData.age}
          onChangeAge={(val) => updateFormData((prev) => ({ ...prev, age: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 2:
      return (
        <Step2Sex
          sex={formData.sex}
          onSelectSex={(val) => updateFormData((prev) => ({ ...prev, sex: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 3:
      return (
        <Step3Height
          heightCm={formData.height_cm}
          onChangeHeight={(val) => updateFormData((prev) => ({ ...prev, height_cm: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 4:
      return (
        <Step4Weight
          weightKg={formData.weight_kg}
          onChangeWeight={(val) => updateFormData((prev) => ({ ...prev, weight_kg: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 5:
      return (
        <Step5Goal
          goal={formData.fitness_goal}
          onSelectGoal={(val) => updateFormData((prev) => ({ ...prev, fitness_goal: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 6:
      return (
        <Step6Lifestyle
          lifestyle={formData.lifestyle_activity}
          onSelectLifestyle={(val) => updateFormData((prev) => ({ ...prev, lifestyle_activity: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 7:
      return (
        <Step7Activities
          selectedActivities={formData.user_activity_preferences}
          onToggleActivity={handleToggleActivity}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 8:
      return (
        <Step8Diet
          diet={formData.diet}
          onSelectDiet={(val) => updateFormData((prev) => ({ ...prev, diet: val }))}
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 9:
      if (showBlindFollowUp) {
        return (
          <Step9bBlindResources
            selectedResources={formData.blind_low_vision_resources}
            onToggleResource={handleToggleBlindResource}
            onContinue={handleStep9bContinue}
            onSkip={handleStep9bContinue}
            onBack={handleStep9bBack}
          />
        );
      }
      return (
        <Step9Accessibility
          selectedNeeds={formData.accessibility_needs}
          otherDetails={formData.accessibility_other_details}
          onToggleNeed={handleToggleAccessibility}
          onChangeOtherDetails={(val) =>
            updateFormData((prev) => ({ ...prev, accessibility_other_details: val }))
          }
          onContinue={handleStep9Continue}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 10:
      return (
        <Step10Safety
          hasRestriction={formData.has_exercise_restriction}
          description={formData.exercise_restriction_description}
          onSelectHasRestriction={(val) =>
            updateFormData((prev) => ({
              ...prev,
              has_exercise_restriction: val,
              exercise_restriction_description: val ? prev.exercise_restriction_description : '',
            }))
          }
          onChangeDescription={(val) =>
            updateFormData((prev) => ({ ...prev, exercise_restriction_description: val }))
          }
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 11:
      return (
        <Step11Equipment
          selectedEquipment={formData.strength_equipment}
          otherEquipment={formData.strength_equipment_other}
          onToggleEquipment={handleToggleEquipment}
          onChangeOtherEquipment={(val) =>
            updateFormData((prev) => ({ ...prev, strength_equipment_other: val }))
          }
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 12:
      return (
        <Step12Experience
          experience={formData.strength_experience}
          onSelectExperience={(val) =>
            updateFormData((prev) => ({ ...prev, strength_experience: val }))
          }
          onContinue={handleNextStep}
          onSkip={handleNextStep}
          onBack={handlePrevStep}
        />
      );
    case 13:
    default:
      return (
        <Step13Summary
          formData={formData}
          onSubmit={handleSubmitProfile}
          onEdit={() => setCurrentStep(1)}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
        />
      );
  }
}
