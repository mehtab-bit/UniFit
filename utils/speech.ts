import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  force?: boolean;
}

// Global configurable speech rate
let globalSpeechRate = 1.0;

// Cooldown tracker to prevent repetitive speech on frequent events
const lastSpokenMap: Map<string, number> = new Map();
let lastSpokenGlobalTime = 0;
const SAME_MESSAGE_COOLDOWN_MS = 2500; // 2.5 seconds
const GLOBAL_MIN_INTERVAL_MS = 1000; // 1.0 seconds between speech triggers

/**
 * Sets the default speech rate for the application
 * Conforms to TalkBack and VoiceOver speech speed preferences (0.75x to 1.5x)
 */
export const setGlobalSpeechRate = (rate: number): void => {
  if (typeof rate === 'number' && rate >= 0.5 && rate <= 2.0) {
    globalSpeechRate = rate;
  }
};

/**
 * Gets the current default speech rate
 */
export const getGlobalSpeechRate = (): number => {
  return globalSpeechRate;
};

/**
 * Normalizes speech rate for different platforms:
 * iOS: 0.0 - 1.0 (with 0.5 being normal) or standard multiplier
 * Android / Web: 0.5 - 2.0 (with 1.0 being normal)
 */
const getPlatformRate = (rateMultiplier: number): number => {
  if (Platform.OS === 'ios') {
    // Expo Speech on iOS handles standard rates around 1.0, but clamp safely
    return Math.max(0.5, Math.min(rateMultiplier, 1.8));
  }
  return Math.max(0.5, Math.min(rateMultiplier, 2.0));
};

/**
 * Speaks an accessible message with built-in cooldowns and configurable rate
 */
export const speak = (message: string, options?: SpeechOptions): void => {
  if (!message || message.trim().length === 0) return;

  const sanitized = message.trim();
  const now = Date.now();

  // Check cooldown for identical message unless forced
  if (!options?.force) {
    const lastSpokenThis = lastSpokenMap.get(sanitized);
    if (lastSpokenThis && now - lastSpokenThis < SAME_MESSAGE_COOLDOWN_MS) {
      return;
    }

    if (now - lastSpokenGlobalTime < GLOBAL_MIN_INTERVAL_MS) {
      return;
    }
  }

  // Update cooldown timestamps
  lastSpokenMap.set(sanitized, now);
  lastSpokenGlobalTime = now;

  const targetRate = options?.rate ?? globalSpeechRate;
  const platformRate = getPlatformRate(targetRate);

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sanitized);
      utterance.rate = platformRate;
      utterance.pitch = options?.pitch || 1.0;
      if (options?.language) utterance.lang = options.language;
      window.speechSynthesis.speak(utterance);
    } else {
      Speech.stop();
      Speech.speak(sanitized, {
        rate: platformRate,
        pitch: options?.pitch || 1.0,
        language: options?.language || 'en-US',
      });
    }
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};

/**
 * Stops any active speech synthesis immediately
 */
export const stopSpeaking = (): void => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
  } catch (err) {
    console.warn('Stop speech error:', err);
  }
};

/**
 * Checks if speech is currently active
 */
export const isSpeakingAsync = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
};

/**
 * Plays a short test sample to allow users to verify their speech speed setting
 */
export const testSpeechSample = (rate?: number): void => {
  const testText = 'UniFit audio guidance test. Universal fitness without barriers, progress without limits.';
  speak(testText, { rate: rate ?? globalSpeechRate, force: true });
};
