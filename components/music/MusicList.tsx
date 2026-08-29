import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useTranslation } from '@/store/languageStore';
import SongActionsModal from './SongActionsModal';
import { SongCover } from './SongCover';

const ITEM_HEIGHT = 68;

interface Props {
  searchQuery?: string;
}

interface SongRowItemProps {
  item: any;
  isActive: boolean;
  isFav: boolean;
  isPlaying: boolean;
  currentColors: typeof Colors.light;
  isRTL: boolean;
  audioFileLabel: string;
  onPlay: (song: any) => void;
  onOpenActions: (song: any) => void;
  onToggleFavorite: (id: string) => void;
}

const SongRowItem = memo(function SongRowItem({
  item,
  isActive,
  isFav,
  isPlaying,
  currentColors,
  isRTL,
  audioFileLabel,
  onPlay,
  onOpenActions,
  onToggleFavorite,
}: SongRowItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.songRow,
        {
          borderBottomColor: currentColors.borderSubtle,
          backgroundColor: isActive ? currentColors.activeRow : 'transparent',
        },
      ]}
      onPress={() => onPlay(item)}
      onLongPress={() => onOpenActions(item)}
      activeOpacity={0.65}
    >
      {/* Artwork / Icon */}
      <View style={styles.artworkWrapper}>
        <SongCover
          uri={item.uri}
          style={styles.artwork}
        />
        {isActive && (
          <View
            style={[
              styles.playingBadge,
              { backgroundColor: currentColors.primary },
            ]}
          >
            <Ionicons
              name={isPlaying ? 'volume-high' : 'pause'}
              size={10}
              color="#fff"
            />
          </View>
        )}
      </View>

      {/* Song Title & Duration Info */}
      <View style={styles.songInfo}>
        <Text
          style={[
            styles.songTitle,
            {
              color: isActive ? currentColors.primary : currentColors.text,
              fontWeight: isActive ? '700' : '500',
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          numberOfLines={1}
        >
          {item.filename}
        </Text>
        <Text
          style={[
            styles.songSubtitle,
            {
              color: currentColors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {item.formattedDuration ||
            (Math.floor(item.duration / 60) + ':' + (Math.floor(item.duration % 60) < 10 ? '0' : '') + Math.floor(item.duration % 60))} • {audioFileLabel}
        </Text>
      </View>

      {/* Favorite Button */}
      <TouchableOpacity
        onPress={() => onToggleFavorite(item.id)}
        style={styles.iconBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={20}
          color={isFav ? currentColors.primary : currentColors.icon}
        />
      </TouchableOpacity>

      {/* 3-Dots Action Button */}
      <TouchableOpacity
        onPress={() => onOpenActions(item)}
        style={styles.iconBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={currentColors.icon}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function MusicList({ searchQuery = '' }: Props) {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;

  // Granular atomic store subscriptions to avoid re-rendering on position updates
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const favorites = usePlayerStore((state) => state.favorites);
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite);
  const playSong = usePlayerStore((state) => state.playSong);

  const songs = useLibraryStore((state) => state.songs);
  const loading = useLibraryStore((state) => state.loading);
  const isScanning = useLibraryStore((state) => state.isScanning);
  const loadSongs = useLibraryStore((state) => state.loadSongs);

  const { t, isRTL } = useTranslation();

  const [selectedSongForActions, setSelectedSongForActions] =
    useState<MediaLibrary.Asset | null>(null);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const openSongActions = useCallback((song: MediaLibrary.Asset) => {
    setSelectedSongForActions(song);
    setActionsModalVisible(true);
  }, []);

  const handlePlaySong = useCallback(
    (song: MediaLibrary.Asset) => {
      playSong(song);
    },
    [playSong]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: MediaLibrary.Asset) => item.id, []);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) =>
      song.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, searchQuery]);

  if (loading && songs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={currentColors.primary} />
        <Text style={{ color: currentColors.text, marginTop: Spacing.md }}>
          {t.loadingLibrary}
        </Text>
      </View>
    );
  }

  if (songs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="musical-notes-outline"
          size={54}
          color={currentColors.icon}
        />
        <Text style={[styles.emptyTitle, { color: currentColors.text }]}>
          {t.noSongs}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: currentColors.textSecondary },
          ]}
        >
          {t.noSongsSubtitle}
        </Text>
      </View>
    );
  }

  if (filteredSongs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="search-outline"
          size={48}
          color={currentColors.icon}
        />
        <Text style={[styles.emptyTitle, { color: currentColors.text }]}>
          {t.noMatchingSongs}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: currentColors.textSecondary },
          ]}
        >
          {t.noMatchingSubtitle}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning && (
        <View
          style={[
            styles.scanningBanner,
            { backgroundColor: currentColors.primaryMuted },
          ]}
        >
          <ActivityIndicator size="small" color={currentColors.primary} />
          <Text
            style={[styles.scanningText, { color: currentColors.primary }]}
          >
            {t.scanning}
          </Text>
        </View>
      )}

      <FlatList
        data={filteredSongs}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingBottom: 155, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={50}
        maxToRenderPerBatch={50}
        windowSize={50}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews={false}
        getItemLayout={getItemLayout}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
        renderItem={({ item }) => {
          const isActive = currentSong === item.filename;
          const isFav = favorites.includes(item.id);

          return (
            <SongRowItem
              item={item}
              isActive={isActive}
              isFav={isFav}
              isPlaying={isPlaying}
              currentColors={currentColors}
              isRTL={isRTL}
              audioFileLabel={t.audioFile}
              onPlay={handlePlaySong}
              onOpenActions={openSongActions}
              onToggleFavorite={handleToggleFavorite}
            />
          );
        }}
      />

      <SongActionsModal
        visible={actionsModalVisible}
        song={selectedSongForActions}
        onClose={() => setActionsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  scanningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  // Clean flat list row with subtle bottom border line
  songRow: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  artworkWrapper: {
    position: 'relative',
  },
  artwork: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
  },
  playingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  songInfo: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  songTitle: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  songSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  iconBtn: {
    padding: Spacing.xs + 2,
    marginLeft: 2,
  },
});