import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/themeStore';

export default function StaticGradientBackground() {
  const { isDark } = useTheme();
  
  // Premium subtle gradient
  const colors: [string, string, string] = isDark
    ? ['#0b0f19', '#101726', '#171a35'] // Rich midnight obsidian to deep cosmic indigo
    : ['#f8fafc', '#f1f5f9', '#ede9fe']; // Crisp clean slate to gentle lavender

  return (
    <LinearGradient
      colors={colors}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}