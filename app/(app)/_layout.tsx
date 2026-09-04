import React from 'react';
import { Tabs } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size || 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
          tabBarAccessibilityLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size || 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarLabel: 'Food',
          tabBarAccessibilityLabel: 'Food and Nutrition',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="silverware-fork-knife" size={size || 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
          tabBarAccessibilityLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size || 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size || 22} color={color} />
          ),
        }}
      />

      {/* Hidden Screens accessible via navigation */}
      <Tabs.Screen
        name="streak-plan"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="cv-session"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="cv-native-test"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="performance-test"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
