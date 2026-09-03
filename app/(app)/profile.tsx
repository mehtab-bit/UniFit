import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAnimationTheme } from '../../context/AnimationContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader} accessible={true} accessibilityRole="header">
    {title.toUpperCase()}
  </Text>
);

const RowItem = ({ 
  icon, 
  title, 
  value, 
  onPress, 
  isLast = false, 
  hasSwitch = false,
  switchValue = false,
  onSwitchChange
}: any) => (
  <TouchableOpacity 
    style={[styles.rowContainer, !isLast && styles.rowBorder]} 
    onPress={onPress} 
    disabled={!onPress && !hasSwitch}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconBox}>
        <Feather name={icon} size={18} color="#040E34" />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {hasSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E2E8F0', true: '#040E34' }}
          thumbColor="#FFFFFF"
        />
      ) : onPress ? (
        <Feather name="chevron-right" size={18} color="#94A3B8" />
      ) : null}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  useScreenAnnouncement('Profile and settings screen.');
  const router = useRouter();
  const { user, profile, signOut, resetOnboarding } = useAuth();
  const {
    audioGuidance, captionsEnabled, vibrationFeedback,
    setAudioGuidance, setCaptionsEnabled, setVibrationFeedback,
  } = useAccessibility();
  const { performanceMode, setPerformanceMode } = useAnimationTheme();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRetakeQuiz = async () => {
    await resetOnboarding();
    router.replace('/quiz');
  };

  const formatGoal = (g: string | null | undefined) => {
    if (g === 'lose_fat') return 'Fat Loss';
    if (g === 'muscle_gain') return 'Muscle Gain';
    return 'Maintain & Tone';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Fitness Identity Hero */}
        <CardSpringEntry index={0}>
          <View style={styles.identityCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{user?.fullName || profile?.full_name || 'Athlete'}</Text>
              <Text style={styles.identityEmail}>{user?.email || 'user@fitness.app'}</Text>
              <View style={styles.goalPill}>
                <Feather name="target" size={12} color="#D4AF37" style={{ marginRight: 4 }} />
                <Text style={styles.goalPillText}>{formatGoal(profile?.fitness_goal)}</Text>
              </View>
            </View>
          </View>
        </CardSpringEntry>

        <CardSpringEntry index={1}>
          <SectionHeader title="Fitness Baseline" />
          <View style={styles.sectionGroup}>
            <RowItem icon="user" title="Age & Sex" value={`${profile?.age || 28} yrs, ${profile?.sex === 'female' ? 'F' : 'M'}`} />
            <RowItem icon="minimize" title="Height & Weight" value={`${profile?.height_cm || 175}cm, ${profile?.weight_kg || 72}kg`} />
            <RowItem icon="activity" title="Daily Activity" value="Moderate" />
            <RowItem icon="coffee" title="Diet" value="Balanced" isLast onPress={handleRetakeQuiz} />
          </View>
        </CardSpringEntry>

        <CardSpringEntry index={2}>
          <SectionHeader title="Preferences" />
          <View style={styles.sectionGroup}>
            <RowItem icon="smartphone" title="Performance Mode" value={performanceMode === 'battery_saver' ? 'Battery Saver' : 'Standard'} onPress={() => setPerformanceMode(performanceMode === 'standard' ? 'battery_saver' : 'standard')} />
            <RowItem icon="bell" title="Notifications" value="Enabled" onPress={() => {}} isLast />
          </View>
        </CardSpringEntry>

        <CardSpringEntry index={3}>
          <SectionHeader title="Accessibility" />
          <View style={styles.sectionGroup}>
            <RowItem icon="volume-2" title="Audio Guidance" hasSwitch switchValue={audioGuidance} onSwitchChange={setAudioGuidance} />
            <RowItem icon="message-square" title="Captions" hasSwitch switchValue={captionsEnabled} onSwitchChange={setCaptionsEnabled} />
            <RowItem icon="smartphone" title="Haptics" hasSwitch switchValue={vibrationFeedback} onSwitchChange={setVibrationFeedback} isLast />
          </View>
        </CardSpringEntry>

        <CardSpringEntry index={4}>
          <SectionHeader title="Settings" />
          <View style={styles.sectionGroup}>
            <RowItem icon="shield" title="Privacy Policy" onPress={() => {}} />
            <RowItem icon="help-circle" title="Support" onPress={() => {}} />
            <RowItem icon="log-out" title="Sign Out" onPress={handleSignOut} isLast />
          </View>
        </CardSpringEntry>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#040E34', letterSpacing: -1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#040E34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  identityInfo: { flex: 1 },
  identityName: { fontSize: 20, fontWeight: '800', color: '#040E34', marginBottom: 2 },
  identityEmail: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  goalPillText: { fontSize: 11, fontWeight: '700', color: '#D4AF37' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    paddingHorizontal: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#040E34',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 15,
    color: '#64748B',
    marginRight: 8,
  },
  footerSpacer: { height: 40 },
});
