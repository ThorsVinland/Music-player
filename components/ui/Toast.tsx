import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  duration?: number;
  onHide?: () => void;
  bottomOffset?: number;
}

export default function Toast({
  visible,
  message,
  icon = 'information-circle-outline',
  duration = 2000,
  onHide,
  bottomOffset = 80,
}: ToastProps) {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible) {
      opacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.back(1.5)),
      });

      timer = setTimeout(() => {
        opacity.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
        translateY.value = withTiming(20, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
        if (onHide) {
          setTimeout(onHide, 220);
        }
      }, duration);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, duration, onHide, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset + Math.max(insets.bottom, 10),
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          {
            backgroundColor: isDark ? '#1e293b' : '#0f172a',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            shadowColor: '#000',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={currentColors.primary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.message,
            {
              color: '#ffffff',
            },
          ]}
        >
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
