import React from 'react';
import { Tabs } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const TabIcon = ({ name, focused, isMci }: { name: any; focused: boolean; isMci?: boolean }) => {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      {isMci ? (
        <MaterialCommunityIcons 
          name={name} 
          size={24} 
          color={focused ? Colors.background : Colors.textSecondary} 
        />
      ) : (
        <Feather 
          name={name} 
          size={22} 
          color={focused ? Colors.background : Colors.textSecondary} 
        />
      )}
    </View>
  );
};

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#040E34',
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
          tabBarAccessibilityLabel: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon name="compass" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarLabel: 'Food',
          tabBarAccessibilityLabel: 'Food and Nutrition',
          tabBarIcon: ({ focused }) => <TabIcon name="silverware-fork-knife" focused={focused} isMci />,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
          tabBarAccessibilityLabel: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-2" focused={focused} />,
        }}
      />

      {/* Hidden Screens (accessible via router.push) */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="streak-plan" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen
        name="cv-session"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="cv-native-test"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen name="performance-test" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#040E34', // Premium dark
  }
});
