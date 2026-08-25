import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import StaticGradientBackground from '../ui/StaticGradientBackground';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 68;
const TAB_BAR_HEIGHT = 56;

export default function ExpandablePlayerCard() {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const {
    currentSong,
    isPlaying,
    position,
    duration,
    playNext,
    playPrevious,
    currentUri,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    favorites,
    toggleFavorite,
    currentIndex,
    playlist,
    togglePlay,
    seekTo,
  } = usePlayerStore();

  const currentSongItem =
    currentIndex >= 0 && currentIndex < playlist.length
      ? playlist[currentIndex]
      : null;
  const isFav = currentSongItem ? favorites.includes(currentSongItem.id) : false;

  // Local seeking state for smooth scrubbing
  const [isSeeking, setIsSeeking] = React.useState(false);
  const [seekValue, setSeekValue] = React.useState(0);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(position);
    }
  }, [position, isSeeking]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Full expansion height (covers nearly full screen)
  const fullPlayerHeight = SCREEN_HEIGHT - insets.top - 10;
  const maxDrag = fullPlayerHeight - MINI_PLAYER_HEIGHT;

  // progress: 0 = collapsed (MiniPlayer), 1 = fully expanded (Full Player)
  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);

  const expandPlayer = () => {
    'worklet';
    progress.value = withSpring(1, { damping: 20, stiffness: 180 });
  };

  const collapsePlayer = () => {
    'worklet';
    progress.value = withSpring(0, { damping: 20, stiffness: 180 });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startProgress.value = progress.value;
    })
    .onUpdate((event) => {
      const deltaProgress = -event.translationY / maxDrag;
      let newProgress = startProgress.value + deltaProgress;
      if (newProgress < 0) newProgress = 0;
      if (newProgress > 1) newProgress = 1;
      progress.value = newProgress;
    })
    .onEnd((event) => {
      // If velocity is high or passed threshold, snap open/close
      if (event.velocityY < -500 || progress.value > 0.45) {
        expandPlayer();
      } else {
        collapsePlayer();
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const currentHeight = interpolate(
      progress.value,
      [0, 1],
      [MINI_PLAYER_HEIGHT, fullPlayerHeight],
      Extrapolation.CLAMP
    );

    const bottomOffset = interpolate(
      progress.value,
      [0, 1],
      [TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) - 10, 0],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [14, 28],
      Extrapolation.CLAMP
    );

    return {
      height: currentHeight,
      bottom: bottomOffset,
      borderRadius: borderRadius,
    };
  });

  const miniPlayerOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.2],
      [1, 0],
      Extrapolation.CLAMP
    );
    const pointerEvents = progress.value > 0.3 ? 'none' : 'auto';
    return {
      opacity,
      display: opacity === 0 ? 'none' : 'flex',
    };
  });

  const fullPlayerOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0.25, 1],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      display: opacity === 0 ? 'none' : 'flex',
    };
  });

  if (!currentSong) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          cardAnimatedStyle,
          {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 10,
            elevation: 16,
          },
        ]}
      >
        {/* ============================================================ */}
        {/* MINI PLAYER VIEW (COLLAPSED STATE)                           */}
        {/* ============================================================ */}
        <Animated.View style={[styles.miniPlayerContent, miniPlayerOpacityStyle]}>
          {/* Top subtle mini progress line */}
          <View
            style={[
              styles.miniProgressLine,
              {
                width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                backgroundColor: currentColors.primary,
              },
            ]}
          />

          <TouchableOpacity
            style={styles.miniInfoContainer}
            onPress={expandPlayer}
            activeOpacity={0.8}
          >
            <Image
              source={
                currentUri?.endsWith('.mp3')
                  ? require('@/assets/images/music.png')
                  : { uri: currentUri || undefined }
              }
              style={styles.miniArtwork}
            />

            <View style={styles.miniTextWrapper}>
              <Text
                style={[styles.miniSongTitle, { color: currentColors.text }]}
                numberOfLines={1}
              >
                {currentSong}
              </Text>
              <Text
                style={[
                  styles.miniArtistName,
                  { color: currentColors.textSecondary },
                ]}
                numberOfLines={1}
              >
                Now Playing • Tap to Expand
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.miniControlsRow}>
            <TouchableOpacity
              onPress={playPrevious}
              style={styles.miniControlBtn}
            >
              <Ionicons
                name="play-skip-back"
                size={22}
                color={currentColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              style={[
                styles.miniPlayBtn,
                { backgroundColor: currentColors.primary },
              ]}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#fff"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={playNext} style={styles.miniControlBtn}>
              <Ionicons
                name="play-skip-forward"
                size={22}
                color={currentColors.text}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* FULL PLAYER CARD VIEW (EXPANDED STATE)                       */}
        {/* ============================================================ */}
        <Animated.View style={[styles.fullPlayerContent, fullPlayerOpacityStyle]}>
          <StaticGradientBackground />

          {/* Top handle & header */}
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={collapsePlayer} style={styles.fullIconBtn}>
              <Ionicons
                name="chevron-down"
                size={28}
                color={currentColors.text}
              />
            </TouchableOpacity>

            <View style={styles.handleIndicator}>
              <View
                style={[
                  styles.handlePill,
                  { backgroundColor: currentColors.textSecondary },
                ]}
              />
              <Text
                style={[
                  styles.fullHeaderTitle,
                  { color: currentColors.textSecondary },
                ]}
              >
                NOW PLAYING
              </Text>
            </View>

            {currentSongItem ? (
              <TouchableOpacity
                onPress={() => toggleFavorite(currentSongItem.id)}
                style={styles.fullIconBtn}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFav ? currentColors.primary : currentColors.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Big Album Artwork */}
          <View style={styles.fullArtworkContainer}>
            <Image
              source={
                currentUri?.endsWith('.mp3')
                  ? require('@/assets/images/music.png')
                  : { uri: currentUri || undefined }
              }
              style={[
                styles.fullArtwork,
                { borderColor: currentColors.glassBorder },
              ]}
            />
          </View>

          {/* Title & Artist */}
          <View style={styles.fullInfoContainer}>
            <Text
              style={[styles.fullSongTitle, { color: currentColors.text }]}
              numberOfLines={2}
            >
              {currentSong}
            </Text>
            <Text
              style={[styles.fullArtistName, { color: currentColors.primary }]}
              numberOfLines={1}
            >
              Audio File • Music Player
            </Text>
          </View>

          {/* Progress / Seek Bar */}
          <View style={styles.fullProgressContainer}>
            <Slider
              style={styles.fullSlider}
              minimumValue={0}
              maximumValue={duration}
              value={seekValue}
              onValueChange={(val) => {
                if (!isSeeking) setIsSeeking(true);
                setSeekValue(val);
              }}
              onSlidingComplete={(val) => {
                setIsSeeking(false);
                seekTo(val);
              }}
              minimumTrackTintColor={currentColors.primary}
              maximumTrackTintColor={currentColors.glassBorder}
              thumbTintColor={currentColors.primary}
            />
            <View style={styles.fullTimeRow}>
              <Text
                style={[
                  styles.fullTimeText,
                  { color: currentColors.textSecondary },
                ]}
              >
                {formatTime(seekValue)}
              </Text>
              <Text
                style={[
                  styles.fullTimeText,
                  { color: currentColors.textSecondary },
                ]}
              >
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          {/* Full Player Controls */}
          <View
            style={[
              styles.fullControlsContainer,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <TouchableOpacity
              onPress={toggleShuffle}
              style={styles.fullControlBtn}
            >
              <Ionicons
                name="shuffle"
                size={26}
                color={
                  isShuffle
                    ? currentColors.primary
                    : currentColors.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playPrevious}
              style={styles.fullMainControlBtn}
            >
              <Ionicons
                name="play-skip-back"
                size={34}
                color={currentColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              style={[
                styles.fullPlayBtn,
                { backgroundColor: currentColors.primary },
              ]}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={38}
                color="#fff"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playNext}
              style={styles.fullMainControlBtn}
            >
              <Ionicons
                name="play-skip-forward"
                size={34}
                color={currentColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleRepeat}
              style={styles.fullControlBtn}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                size={26}
                color={
                  repeatMode !== 'off'
                    ? currentColors.primary
                    : currentColors.textSecondary
                }
              />
              {repeatMode === 'one' && (
                <Text
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 4,
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: currentColors.primary,
                  }}
                >
                  1
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999,
  },
  // Mini Player Styles
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
  },
  miniProgressLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2.5,
  },
  miniInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  miniArtwork: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  miniTextWrapper: {
    flex: 1,
    marginLeft: Spacing.sm + 2,
  },
  miniSongTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  miniArtistName: {
    fontSize: 11,
    marginTop: 2,
  },
  miniControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniControlBtn: {
    padding: 6,
  },
  miniPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Full Player Styles
  fullPlayerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  handleIndicator: {
    alignItems: 'center',
  },
  handlePill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
    opacity: 0.5,
  },
  fullHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  fullIconBtn: {
    padding: Spacing.sm,
  },
  fullArtworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  fullArtwork: {
    width: '88%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  fullInfoContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fullSongTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  fullArtistName: {
    fontSize: 15,
    fontWeight: '600',
  },
  fullProgressContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  fullSlider: {
    width: '100%',
    height: 36,
  },
  fullTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  fullTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fullControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  fullControlBtn: {
    padding: Spacing.sm,
  },
  fullMainControlBtn: {
    padding: Spacing.sm,
  },
  fullPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
