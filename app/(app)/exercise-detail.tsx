import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../../components/animations/ScalePressable';

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <ScalePressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#000000" />
        </ScalePressable>
        <Text style={styles.headerTitle}>EXERCISE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.heroSection}>
          <Text style={styles.exerciseName}>CHAIR SQUAT</Text>
          <View style={styles.metricsRow}>
            <Text style={styles.metricsText}>2 × 8</Text>
            <Text style={styles.metricsDot}>·</Text>
            <Text style={styles.metricsText}>70 SEC REST</Text>
          </View>
        </View>

        <View style={styles.cuesContainer}>
          <View style={styles.cueRow}>
            <Feather name="check" size={16} color="#000000" style={styles.cueIcon} />
            <Text style={styles.cueText}>Feet shoulder-width</Text>
          </View>
          <View style={styles.cueRow}>
            <Feather name="check" size={16} color="#000000" style={styles.cueIcon} />
            <Text style={styles.cueText}>Hips back</Text>
          </View>
          <View style={styles.cueRow}>
            <Feather name="check" size={16} color="#000000" style={styles.cueIcon} />
            <Text style={styles.cueText}>Drive through heels</Text>
          </View>
        </View>

        <View style={styles.collapsibleSection}>
          <ScalePressable style={styles.collapsibleHeader} onPress={() => toggleSection('equipment')}>
            <Text style={styles.collapsibleTitle}>EQUIPMENT</Text>
            <Feather name={expandedSection === 'equipment' ? 'minus' : 'plus'} size={20} color="#000000" />
          </ScalePressable>
          {expandedSection === 'equipment' && (
            <View style={styles.collapsibleContent}>
              <Text style={styles.collapsibleText}>Sturdy chair or bench</Text>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <ScalePressable style={styles.collapsibleHeader} onPress={() => toggleSection('instructions')}>
            <Text style={styles.collapsibleTitle}>INSTRUCTIONS</Text>
            <Feather name={expandedSection === 'instructions' ? 'minus' : 'plus'} size={20} color="#000000" />
          </ScalePressable>
          {expandedSection === 'instructions' && (
            <View style={styles.collapsibleContent}>
              <Text style={styles.collapsibleText}>Stand in front of the chair. Lower your hips until you lightly touch the seat, then stand back up. Keep your chest up and core engaged throughout.</Text>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <ScalePressable style={styles.collapsibleHeader} onPress={() => toggleSection('accessibility')}>
            <Text style={styles.collapsibleTitle}>ACCESSIBILITY GUIDANCE</Text>
            <Feather name={expandedSection === 'accessibility' ? 'minus' : 'plus'} size={20} color="#000000" />
          </ScalePressable>
          {expandedSection === 'accessibility' && (
            <View style={styles.collapsibleContent}>
              <Text style={styles.collapsibleText}>Hold onto a wall or sturdy support if balance is an issue. Reduce depth if you experience knee pain.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: Layout.spacing.xxl,
  },
  exerciseName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1,
  },
  metricsDot: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4D4D8',
    marginHorizontal: 12,
  },
  cuesContainer: {
    backgroundColor: '#F4F4F5',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.xxl,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  cueIcon: {
    marginRight: 12,
  },
  cueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  collapsibleSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },
  collapsibleContent: {
    paddingBottom: 20,
    paddingRight: 20,
  },
  collapsibleText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#71717A',
  },
});
