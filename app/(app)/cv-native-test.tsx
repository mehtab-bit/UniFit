import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Dev-only native pose debug route. The native MediaPipe screen is required
 * lazily so Expo Go / MoveNet builds never evaluate Vision Camera modules.
 */
export default function NativePoseTestScreen() {
  const [DebugView, setDebugView] = useState<ComponentType | null>(null);

  useEffect(() => {
    setDebugView(
      () => require('../../src/cv/native/NativePoseDebugView').default
    );
  }, []);

  if (!DebugView) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading pose debug view…</Text>
      </View>
    );
  }

  return <DebugView />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220'
  },
  loading: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});
