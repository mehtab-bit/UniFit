import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import { speak, stopSpeaking, setGlobalSpeechRate, testSpeechSample } from '../utils/speech';
import { triggerHaptic, HapticType } from '../utils/haptics';
import { SafeStorage } from '../lib/supabase';

const ACCESSIBILITY_STORAGE_KEYS = {
  AUDIO_GUIDANCE: '@unifit_a11y_audio_guidance',
  CAPTIONS_ENABLED: '@unifit_a11y_captions',
  VIBRATION_FEEDBACK: '@unifit_a11y_vibration',
  SPEECH_RATE: '@unifit_a11y_speech_rate',
};

export interface WorkoutFeedbackPayload {
  text: string;
  repCount?: number;
  formScore?: number;
  correction?: string;
  priority?: 'high' | 'normal';
  haptic?: HapticType;
}

export interface AccessibilityContextType {
  isScreenReaderActive: boolean;
  audioGuidance: boolean;
  captionsEnabled: boolean;
  vibrationFeedback: boolean;
  speechRate: number;
  activeCaption: string | null;
  setAudioGuidance: (enabled: boolean) => Promise<void>;
  setCaptionsEnabled: (enabled: boolean) => Promise<void>;
  setVibrationFeedback: (enabled: boolean) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  announce: (message: string) => void;
  provideFeedback: (payload: WorkoutFeedbackPayload) => void;
  clearCaption: () => void;
  testSpeechRateSample: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState<boolean>(false);
  const [audioGuidance, setAudioGuidanceState] = useState<boolean>(true);
  const [captionsEnabled, setCaptionsEnabledState] = useState<boolean>(false);
  const [vibrationFeedback, setVibrationFeedbackState] = useState<boolean>(true);
  const [speechRate, setSpeechRateState] = useState<number>(1.0);
  const [activeCaption, setActiveCaption] = useState<string | null>(null);

  // Initialize Screen Reader Detection and Storage Preferences
  useEffect(() => {
    // 1. Screen reader detection (TalkBack on Android, VoiceOver on iOS)
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderActive(enabled);
    });

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setIsScreenReaderActive(enabled);
      }
    );

    // 2. Load stored accessibility settings
    const loadSettings = async () => {
      try {
        const storedAudio = await SafeStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.AUDIO_GUIDANCE);
        if (storedAudio !== null) setAudioGuidanceState(storedAudio === 'true');

        const storedCaptions = await SafeStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.CAPTIONS_ENABLED);
        if (storedCaptions !== null) setCaptionsEnabledState(storedCaptions === 'true');

        const storedVibration = await SafeStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.VIBRATION_FEEDBACK);
        if (storedVibration !== null) setVibrationFeedbackState(storedVibration === 'true');

        const storedRate = await SafeStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.SPEECH_RATE);
        if (storedRate !== null) {
          const parsedRate = parseFloat(storedRate);
          if (!isNaN(parsedRate) && parsedRate >= 0.5 && parsedRate <= 2.0) {
            setSpeechRateState(parsedRate);
            setGlobalSpeechRate(parsedRate);
          }
        }
      } catch (err) {
        console.warn('Failed to load accessibility settings:', err);
      }
    };

    loadSettings();

    return () => {
      screenReaderSubscription.remove();
    };
  }, []);

  const setAudioGuidance = async (enabled: boolean) => {
    setAudioGuidanceState(enabled);
    if (!enabled) stopSpeaking();
    await SafeStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.AUDIO_GUIDANCE, enabled ? 'true' : 'false');
  };

  const setCaptionsEnabled = async (enabled: boolean) => {
    setCaptionsEnabledState(enabled);
    if (!enabled) setActiveCaption(null);
    await SafeStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.CAPTIONS_ENABLED, enabled ? 'true' : 'false');
  };

  const setVibrationFeedback = async (enabled: boolean) => {
    setVibrationFeedbackState(enabled);
    await SafeStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.VIBRATION_FEEDBACK, enabled ? 'true' : 'false');
  };

  const setSpeechRate = async (rate: number) => {
    setSpeechRateState(rate);
    setGlobalSpeechRate(rate);
    await SafeStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.SPEECH_RATE, rate.toString());
  };

  const testSpeechRateSample = () => {
    testSpeechSample(speechRate);
  };

  const announce = (message: string) => {
    if (!message) return;
    AccessibilityInfo.announceForAccessibility(message);
  };

  const clearCaption = () => {
    setActiveCaption(null);
  };

  /**
   * Dispatches unified multi-modal accessibility feedback
   * Respects TalkBack & VoiceOver guidelines by coordinating screen-reader announcements
   * with custom in-app audio guidance and visual captions.
   */
  const provideFeedback = useCallback((payload: WorkoutFeedbackPayload) => {
    const { text, correction, haptic, priority } = payload;
    const isHighPriority = priority === 'high';

    // 1. Caption display (if captions enabled)
    if (captionsEnabled) {
      setActiveCaption(text);
      // Auto clear after 4 seconds
      setTimeout(() => {
        setActiveCaption((current) => (current === text ? null : current));
      }, 4000);
    }

    // 2. Audio speech guidance (if audio guidance or screen reader is active)
    if (audioGuidance || isScreenReaderActive) {
      const speechText = correction ? `${text}. ${correction}` : text;
      speak(speechText, { rate: speechRate, force: isHighPriority });
    }

    // 3. Haptic feedback (if vibration feedback enabled)
    if (vibrationFeedback && haptic) {
      triggerHaptic(haptic);
    }

    // 4. Native Accessibility announcement for TalkBack / VoiceOver
    announce(text);
  }, [audioGuidance, captionsEnabled, isScreenReaderActive, speechRate, vibrationFeedback]);

  return (
    <AccessibilityContext.Provider
      value={{
        isScreenReaderActive,
        audioGuidance,
        captionsEnabled,
        vibrationFeedback,
        speechRate,
        activeCaption,
        setAudioGuidance,
        setCaptionsEnabled,
        setVibrationFeedback,
        setSpeechRate,
        announce,
        provideFeedback,
        clearCaption,
        testSpeechRateSample,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
