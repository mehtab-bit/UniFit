import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface FormCuesProps {
  cues?: string[];
  title?: string;
}

export const FormCues: React.FC<FormCuesProps> = ({
  cues,
  title = 'KEY FORM CUES',
}) => {
  if (!cues || cues.length === 0) return null;

  return (
    <View style={styles.container} accessible={true} accessibilityRole="summary" accessibilityLabel={title}>
      <Text style={styles.heading}>{title}</Text>
      {cues.map((cue, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Feather name="check" size={13} color={Colors.primary} style={styles.icon} />
          <Text style={styles.text}>{cue}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm + 2,
    marginTop: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  icon: {
    marginRight: 6,
    marginTop: 2,
  },
  text: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
