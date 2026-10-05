import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/themeStore';

interface Props {
  /** 'yellow' = الخلفية الصفراء الخاصة بصفحة المشغل. الباقي كما كان سابقاً */
  variant?: 'default' | 'yellow';
}

export default function StaticGradientBackground({ variant = 'default' }: Props) {
  const { isDark } = useTheme();

  if (variant === 'yellow') {
    return (
      <LinearGradient
        colors={['#FFC71F', '#FFC21A', '#FDB912']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  }

  const colors: [string, string, string] = isDark
    ? ['#0b0f19', '#101726', '#171a35']
    : ['#f8fafc', '#f1f5f9', '#ede9fe'];

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