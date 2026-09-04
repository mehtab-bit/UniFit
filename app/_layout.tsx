import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { AnimationProvider } from '../context/AnimationContext';
import { CaptionOverlay } from '../components/common/CaptionOverlay';
import { Colors } from '../constants/colors';

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const text = args
        .map((arg) => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return arg.stack || arg.message;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join('\n');
      if (text.includes('Maximum update depth')) {
        originalError('[UniFit-depth] FULL WARNING PAYLOAD:\n' + text);
      }
    } catch {
      // Never let the diagnostic itself break the app.
    }
    originalError(...args);
  };
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <AnimationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="splash" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="quiz" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
            <CaptionOverlay />
          </AnimationProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
