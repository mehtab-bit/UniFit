import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export const CaptionOverlay: React.FC = () => {
  const { captionsEnabled, activeCaption } = useAccessibility();

  if (!captionsEnabled || !activeCaption) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      pointerEvents="none"
    >
      <View style={styles.captionBubble}>
        <Text style={styles.captionText}>{activeCaption}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  captionBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    maxWidth: '100%',
    ...Layout.shadows.card,
  },
  captionText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});
