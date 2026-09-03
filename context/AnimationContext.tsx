import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SafeStorage } from '../lib/supabase';

export type PerformanceMode = 'standard' | 'battery_saver' | 'low_end';

export interface PerformanceBudgetConfig {
  enableFloatingAnimations: boolean;
  enableSpringEntries: boolean;
  enableRepPopScaling: boolean;
  enableSvgRingAnimations: boolean;
  enableParticles: boolean;
  animationDurationScale: number; // 1.0 = normal, 0.6 = fast, 0.0 = instant
  springDamping: number;
  springStiffness: number;
}

interface AnimationContextType {
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => Promise<void>;
  config: PerformanceBudgetConfig;
  isAutoDetected: boolean;
}

const STORAGE_KEY_PERFORMANCE_MODE = '@unifit_performance_mode';

const BUDGET_CONFIGS: Record<PerformanceMode, PerformanceBudgetConfig> = {
  standard: {
    enableFloatingAnimations: true,
    enableSpringEntries: true,
    enableRepPopScaling: true,
    enableSvgRingAnimations: true,
    enableParticles: true,
    animationDurationScale: 1.0,
    springDamping: 14,
    springStiffness: 120,
  },
  battery_saver: {
    enableFloatingAnimations: false,
    enableSpringEntries: true,
    enableRepPopScaling: true,
    enableSvgRingAnimations: true,
    enableParticles: false,
    animationDurationScale: 0.7,
    springDamping: 18,
    springStiffness: 150,
  },
  low_end: {
    enableFloatingAnimations: false,
    enableSpringEntries: false,
    enableRepPopScaling: false,
    enableSvgRingAnimations: false,
    enableParticles: false,
    animationDurationScale: 0.0,
    springDamping: 25,
    springStiffness: 200,
  },
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [performanceMode, setPerformanceModeState] = useState<PerformanceMode>('standard');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);

  // Initialize performance mode
  useEffect(() => {
    const initMode = async () => {
      try {
        const saved = await SafeStorage.getItem(STORAGE_KEY_PERFORMANCE_MODE);
        if (saved && (saved === 'standard' || saved === 'battery_saver' || saved === 'low_end')) {
          setPerformanceModeState(saved as PerformanceMode);
          setIsAutoDetected(false);
        } else {
          // Heuristic auto-detection for device capability
          setPerformanceModeState('standard');
          setIsAutoDetected(true);
        }
      } catch (err) {
        console.warn('Failed to load performance mode preference:', err);
      }
    };
    initMode();
  }, []);

  const setPerformanceMode = useCallback(async (mode: PerformanceMode) => {
    setPerformanceModeState(mode);
    setIsAutoDetected(false);
    try {
      await SafeStorage.setItem(STORAGE_KEY_PERFORMANCE_MODE, mode);
    } catch (err) {
      console.warn('Failed to persist performance mode preference:', err);
    }
  }, []);

  const config = BUDGET_CONFIGS[performanceMode];

  return (
    <AnimationContext.Provider
      value={{
        performanceMode,
        setPerformanceMode,
        config,
        isAutoDetected,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationTheme = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      performanceMode: 'standard',
      setPerformanceMode: async () => {},
      config: BUDGET_CONFIGS.standard,
      isAutoDetected: true,
    };
  }
  return context;
};
