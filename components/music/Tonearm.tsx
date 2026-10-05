import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TonearmProps {
  /** مركز محور الذراع (Pivot) بإحداثيات الحاوية الأب (يجب أن تكون الحاوية بملء الشاشة) */
  pivotX: number;
  pivotY: number;
  /** حجم الكتلة السوداء عند المحور */
  pivotSize: number;
  /** طول الذراع من المحور إلى الرأس */
  armLength: number;
  isPlaying: boolean;
  accentColor?: string;
  ringColor?: string;
  onPlayStateChange: (playing: boolean) => void;
}

/**
 * الزوايا (الدوران مع عقارب الساعة = موجب = الرأس يتجه يساراً نحو القرص):
 *  ACTIVE  : الرأس على القرص (تشغيل)
 *  RESTING : الرأس خارج القرص جهة اليمين (إيقاف)
 */
const ARM_ACTIVE_ANGLE = 9;
const ARM_RESTING_ANGLE = -20;
const MIN_ANGLE = -26;
const MAX_ANGLE = 28;
const SNAP_MIDPOINT = (ARM_ACTIVE_ANGLE + ARM_RESTING_ANGLE) / 2;

const clamp = (v: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(v, min), max);
};

export default function Tonearm({
  pivotX,
  pivotY,
  pivotSize,
  armLength,
  isPlaying,
  accentColor = '#8b5cf6',
  ringColor = 'rgba(0,0,0,0.12)',
  onPlayStateChange,
}: TonearmProps) {
  const armAngle = useSharedValue(isPlaying ? ARM_ACTIVE_ANGLE : ARM_RESTING_ANGLE);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      armAngle.value = withSpring(isPlaying ? ARM_ACTIVE_ANGLE : ARM_RESTING_ANGLE, {
        damping: 14,
        stiffness: 85,
      });
    }
  }, [isPlaying]);

  const handleStateChange = (shouldPlay: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPlayStateChange(shouldPlay);
  };

  // منطقة اللمس (كلها داخل حدود الـ View الأب حتى تعمل على أندرويد)
  const hitW = Math.max(armLength * 1.1, pivotSize * 3);
  const PAD = pivotSize * 0.5;
  const cx = hitW / 2; // مركز المحور داخل منطقة اللمس
  const cy = PAD + pivotSize / 2;
  const hitH = cy + armLength + pivotSize * 0.4;

  const blockH = pivotSize * 0.72;
  const tipH = pivotSize * 0.34;
  const rodH = armLength - blockH * 0.5 - tipH;
  const ringSize = pivotSize * 1.7;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const dx = e.x - cx;
      const dy = Math.max(10, e.y - cy);
      const deg = (Math.atan2(-dx, dy) * 180) / Math.PI;
      armAngle.value = clamp(deg, MIN_ANGLE, MAX_ANGLE);
    })
    .onEnd(() => {
      'worklet';
      const shouldPlay = armAngle.value > SNAP_MIDPOINT;
      armAngle.value = withSpring(shouldPlay ? ARM_ACTIVE_ANGLE : ARM_RESTING_ANGLE, {
        damping: 14,
        stiffness: 90,
      });
      runOnJS(handleStateChange)(shouldPlay);
    })
    .onFinalize(() => {
      'worklet';
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd((_e, success) => {
    'worklet';
    if (!success) return;
    const next = !isPlaying;
    armAngle.value = withSpring(next ? ARM_ACTIVE_ANGLE : ARM_RESTING_ANGLE, {
      damping: 14,
      stiffness: 85,
    });
    runOnJS(handleStateChange)(next);
  });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armAngle.value}deg` }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={{
          position: 'absolute',
          width: hitW,
          height: hitH,
          left: pivotX - cx,
          top: pivotY - cy,
          zIndex: 20,
        }}
      >
        {/* الدائرة الباهتة حول المحور */}
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: ringColor,
              left: cx - ringSize / 2,
              top: cy - ringSize / 2,
            },
          ]}
        />

        {/* حاوية الدوران: ارتفاعها ضعف الذراع حتى يكون مركز الدوران = المحور بالضبط */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: pivotSize,
              height: armLength * 2,
              left: cx - pivotSize / 2,
              top: cy - armLength,
              alignItems: 'center',
            },
            armStyle,
          ]}
        >
          <View style={{ width: pivotSize, height: armLength }} />

          <View style={{ width: pivotSize, height: armLength, alignItems: 'center' }}>
            {/* الكتلة السوداء عند المحور */}
            <View
              style={[
                styles.block,
                {
                  width: pivotSize * 0.92,
                  height: blockH,
                  marginTop: -blockH * 0.5,
                  borderRadius: pivotSize * 0.12,
                  backgroundColor: accentColor,
                },
              ]}
            />
            {/* القضيب الفضي */}
            <View style={[styles.rod, { height: rodH }]} />
            {/* رأس الإبرة */}
            <View
              style={[
                styles.tip,
                { width: pivotSize * 0.2, height: tipH, borderRadius: 3, backgroundColor: accentColor },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(60, 35, 0, 0.14)',
  },
  block: {
    backgroundColor: '#1b1411',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  rod: {
    width: 5,
    backgroundColor: '#b4b9cf',
    borderRadius: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tip: {
    backgroundColor: '#1b1411',
  },
});