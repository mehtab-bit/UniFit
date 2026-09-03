import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';

/**
 * Triggers safe haptic feedback based on feedback type
 */
export const triggerHaptic = async (type: HapticType = 'light'): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'error' || type === 'warning') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate(50);
      }
    }
    return;
  }

  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'light':
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  } catch (err) {
    // Haptics not supported on device/simulator
  }
};
