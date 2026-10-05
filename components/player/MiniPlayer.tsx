import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { SongCover } from '../music/SongCover';
import { useTranslation } from '@/store/languageStore';

export const MINI_PLAYER_HEIGHT = 64;

export default function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  const {
    currentSong,
    isPlaying,
    position,
    duration,
    playNext,
    playPrevious,
    currentUri,
  } = usePlayerStore();
  const { togglePlay } = useGlobalAudio();

  if (!currentSong) return null;

  // Float exactly above the 58dp bottom navigation bar
  const bottomOffset = 58 + Math.max(insets.bottom, 8) + 8;
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleOpenFullPlayer = () => {
    router.push('/player');
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          backgroundColor: isDark ? '#161b26' : '#ffffff',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      {/* Top mini progress line */}
      <View
        style={[
          styles.progressLine,
          {
            width: `${progressPercent}%`,
            backgroundColor: currentColors.primary,
          },
        ]}
      />

      {/* Main tap area navigating to full-screen modal player */}
      <TouchableOpacity
        style={styles.infoContainer}
        onPress={handleOpenFullPlayer}
        activeOpacity={0.85}
      >
        <SongCover uri={currentUri} style={styles.artwork} />

        <View style={styles.textWrapper}>
          <Text
            style={[styles.songTitle, { color: currentColors.text }]}
            numberOfLines={1}
          >
            {currentSong}
          </Text>
          <Text
            style={[styles.artistName, { color: currentColors.textSecondary }]}
            numberOfLines={1}
          >
            {t.tapToExpand}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Controls row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={playPrevious}
          style={styles.controlBtn}
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
          style={[styles.playBtn, { backgroundColor: currentColors.primary }]}
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
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="play-skip-forward"
            size={20}
            color={currentColors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
    zIndex: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  progressLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2.5,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  textWrapper: {
    flex: 1,
    marginLeft: Spacing.sm + 4,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  artistName: {
    fontSize: 11,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
