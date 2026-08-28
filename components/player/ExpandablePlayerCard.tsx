import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
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
import { useTranslation } from '@/store/languageStore';
import StaticGradientBackground from '../ui/StaticGradientBackground';
import { SongCover } from '../music/SongCover';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 68;
const MINI_PLAYER_MARGIN = 8;
const TAB_BAR_BASE_HEIGHT = 58;

export default function ExpandablePlayerCard() {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const {
    currentSong,
    currentUri,
    isPlaying,
    position,
    duration,
    playNext,
    playPrevious,
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
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Full expansion height (covers 100% of the entire screen)
  const fullPlayerHeight = SCREEN_HEIGHT;
  const maxDrag = fullPlayerHeight - MINI_PLAYER_HEIGHT;

  // progress: 0 = collapsed (MiniPlayer), 1 = fully expanded (Full Player)
  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);

  const updateExpandedState = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  const expandPlayer = useCallback(() => {
    'worklet';
    progress.value = withTiming(
      1,
      {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(updateExpandedState)(true);
        }
      }
    );
    runOnJS(updateExpandedState)(true);
  }, [progress, updateExpandedState]);

  const collapsePlayer = useCallback(() => {
    'worklet';
    progress.value = withTiming(
      0,
      {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(updateExpandedState)(false);
        }
      }
    );
    runOnJS(updateExpandedState)(false);
  }, [progress, updateExpandedState]);

  // Android Back Button handling: when player is expanded, collapse it rather than exiting app
  useEffect(() => {
    const onBackPress = () => {
      if (isExpanded || progress.value > 0.05) {
        collapsePlayer();
        return true; // Prevent default back action
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [isExpanded, progress, collapsePlayer]);

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
      // Snap to open or closed with smooth timing, avoiding bounce/oscillation
      if (event.velocityY < -400 || progress.value > 0.45) {
        expandPlayer();
      } else {
        collapsePlayer();
      }
    });

  // Calculate bottom offset in collapsed state (above bottom navigation bar)
  const collapsedBottomOffset =
    TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 8) + MINI_PLAYER_MARGIN;

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
      [collapsedBottomOffset, 0],
      Extrapolation.CLAMP
    );

    const sideMargin = interpolate(
      progress.value,
      [0, 1],
      [10, 0],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [16, 0],
      Extrapolation.CLAMP
    );

    const borderWidth = interpolate(
      progress.value,
      [0, 0.9, 1],
      [1, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      height: currentHeight,
      bottom: bottomOffset,
      left: sideMargin,
      right: sideMargin,
      borderRadius: borderRadius,
      borderWidth: borderWidth,
    };
  });

  const miniPlayerOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.15],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      display: opacity <= 0.01 ? 'none' : 'flex',
    };
  });

  const fullPlayerOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0.2, 1],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      display: opacity <= 0.01 ? 'none' : 'flex',
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
            backgroundColor: isDark ? '#161f30' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.35 : 0.12,
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
            activeOpacity={0.85}
          >
            <SongCover
              uri={currentUri}
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
                {t.tapToExpand}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.miniControlsRow}>
            <TouchableOpacity
              onPress={playPrevious}
              style={styles.miniControlBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="play-skip-back"
                size={20}
                color={currentColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              style={[
                styles.miniPlayBtn,
                { backgroundColor: currentColors.primary },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#fff"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playNext}
              style={styles.miniControlBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={currentColors.text}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* FULL PLAYER CARD VIEW (EXPANDED 100% FULL SCREEN STATE)      */}
        {/* ============================================================ */}
        <Animated.View style={[styles.fullPlayerContent, fullPlayerOpacityStyle]}>
          <StaticGradientBackground />

          {/* Top handle & header with insets.top padding */}
          <View
            style={[
              styles.fullHeader,
              { paddingTop: insets.top + Spacing.sm },
            ]}
          >
            <TouchableOpacity
              onPress={collapsePlayer}
              style={styles.fullIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
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
                {t.nowPlaying}
              </Text>
            </View>

            {currentSongItem ? (
              <TouchableOpacity
                onPress={() => toggleFavorite(currentSongItem.id)}
                style={styles.fullIconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFav ? currentColors.primary : currentColors.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Big Album Artwork */}
          <View style={styles.fullArtworkContainer}>
            <SongCover
              uri={currentUri}
              style={[
                styles.fullArtwork,
                {
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
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
              {t.audioFile} • {t.musicPlayer}
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
              maximumTrackTintColor={
                isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)'
              }
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
              { paddingBottom: Math.max(insets.bottom, 16) + Spacing.lg },
            ]}
          >
            <TouchableOpacity
              onPress={toggleShuffle}
              style={styles.fullControlBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              activeOpacity={0.85}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                    top: 8,
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
    marginLeft: Spacing.sm + 4,
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
    gap: 8,
  },
  miniControlBtn: {
    padding: 6,
  },
  miniPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    maxHeight: 320,
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
    marginBottom: 6,
  },
  fullArtistName: {
    fontSize: 14,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
