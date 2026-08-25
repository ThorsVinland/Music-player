import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import ExpandablePlayerCard from '@/components/player/ExpandablePlayerCard';
import { usePlayerStore } from '@/store/playerStore';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const currentSong = usePlayerStore((state) => state.currentSong);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: currentColors.primary,
          tabBarInactiveTintColor: currentColors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderTopColor: currentColors.border,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            borderTopWidth: 1,
          },
          tabBarBackground: () => (
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={90}
              style={{ flex: 1 }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => (
              <Ionicons name="musical-notes" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-sharp" size={22} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Persistent Solid Expandable Player (Mini + Full Sheet) */}
      {currentSong && <ExpandablePlayerCard />}
    </>
  );
}
