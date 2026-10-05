import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface VinylPlayerProps {
  size: number;
  artworkSource: ImageSourcePropType;
  isPlaying: boolean;
  accentColor?: string;
}

const SPIN_DURATION = 9000; // ms لكل دورة كاملة
const ARTWORK_RATIO = 0.55; // الصورة الدائرية في المنتصف ≈ 55% من القرص

export default function VinylPlayer({ size, artworkSource, isPlaying, accentColor = '#8b5cf6' }: VinylPlayerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      const start = rotation.value % 360;
      rotation.value = start;
      rotation.value = withRepeat(
        withTiming(start + 360, { duration: SPIN_DURATION, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
    return () => cancelAnimation(rotation);
  }, [isPlaying]);

  const discAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const artworkSize = size * ARTWORK_RATIO;
  const c = size / 2;
  const grooveStart = artworkSize / 2 + size * 0.02;
  const grooveEnd = c - size * 0.015;
  const GROOVES = 14;

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: c, backgroundColor: '#17110f' },
        styles.discShadow,
        discAnimatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2a211e" />
            <Stop offset="65%" stopColor="#1a1311" />
            <Stop offset="100%" stopColor="#0d0908" />
          </RadialGradient>
        </Defs>

        <Circle cx={c} cy={c} r={c} fill="url(#vinylGrad)" />

        {Array.from({ length: GROOVES }).map((_, i) => (
          <Circle
            key={i}
            cx={c}
            cy={c}
            r={grooveStart + (i * (grooveEnd - grooveStart)) / (GROOVES - 1)}
            stroke="rgba(255,255,255,0.045)"
            strokeWidth={1}
            fill="none"
          />
        ))}

        <Circle
          cx={c}
          cy={c}
          r={artworkSize / 2 + 3}
          stroke={accentColor}
          strokeOpacity={0.45}
          strokeWidth={1.5}
          fill="none"
        />

        {/* حافة لامعة خفيفة */}
        <Circle
          cx={c}
          cy={c}
          r={c - 1}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>

      <View
        style={[
          styles.artworkWrapper,
          {
            width: artworkSize,
            height: artworkSize,
            borderRadius: artworkSize / 2,
            top: (size - artworkSize) / 2,
            left: (size - artworkSize) / 2,
          },
        ]}
      >
        <Image
          source={artworkSource}
          style={{ width: '100%', height: '100%', borderRadius: artworkSize / 2 }}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  discShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  artworkWrapper: {
    position: 'absolute',
    overflow: 'hidden',
  },
});