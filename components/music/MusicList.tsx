import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import SongActionsModal from './SongActionsModal';

interface Props {
  searchQuery?: string;
}

export default function MusicList({ searchQuery = '' }: Props) {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const { favorites, toggleFavorite, currentSong, playSong } = usePlayerStore();
  const { songs, loading, isScanning, loadSongs } = useLibraryStore();

  const [selectedSongForActions, setSelectedSongForActions] =
    useState<MediaLibrary.Asset | null>(null);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

  const openSongActions = (song: MediaLibrary.Asset) => {
    setSelectedSongForActions(song);
    setActionsModalVisible(true);
  };

  if (loading && songs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={currentColors.primary} />
        <Text style={{ color: currentColors.text, marginTop: Spacing.md }}>
          Loading your music library...
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
          No songs found
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: currentColors.textSecondary },
          ]}
        >
          Tap the scan button in the header to scan your device for audio files.
        </Text>
      </View>
    );
  }

  const filteredSongs = songs.filter((song) =>
    song.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredSongs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="search-outline"
          size={48}
          color={currentColors.icon}
        />
        <Text style={[styles.emptyTitle, { color: currentColors.text }]}>
          No matching songs
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: currentColors.textSecondary },
          ]}
        >
          Try searching with a different keyword.
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
            { backgroundColor: currentColors.primary + '20' },
          ]}
        >
          <ActivityIndicator size="small" color={currentColors.primary} />
          <Text
            style={[styles.scanningText, { color: currentColors.primary }]}
          >
            Scanning for new audio files...
          </Text>
        </View>
      )}

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = currentSong === item.filename;
          const isFav = favorites.includes(item.id);

          return (
            <TouchableOpacity
              style={[
                styles.songItem,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? 'rgba(139, 92, 246, 0.2)'
                      : 'rgba(236, 72, 153, 0.15)'
                    : currentColors.glassBackground,
                  borderColor: isActive
                    ? currentColors.primary
                    : currentColors.glassBorder,
                },
              ]}
              onPress={() => playSong(item)}
              onLongPress={() => openSongActions(item)}
              activeOpacity={0.7}
            >
              <Image
                source={
                  item?.uri?.endsWith('.mp3')
                    ? require('@/assets/images/music.png')
                    : { uri: item.uri }
                }
                style={styles.artwork}
              />

              <View style={styles.songInfo}>
                <Text
                  style={[
                    styles.songTitle,
                    {
                      color: isActive
                        ? currentColors.primary
                        : currentColors.text,
                      fontWeight: isActive ? 'bold' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.filename}
                </Text>
                <Text
                  style={[
                    styles.songSubtitle,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  {Math.floor(item.duration / 60)}:
                  {Math.floor(item.duration % 60) < 10 ? '0' : ''}
                  {Math.floor(item.duration % 60)} • Audio
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFav ? currentColors.primary : currentColors.icon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openSongActions(item)}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={18}
                  color={currentColors.icon}
                />
              </TouchableOpacity>
            </TouchableOpacity>
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
  },
  scanningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  songInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  songTitle: {
    fontSize: 15,
  },
  songSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  iconBtn: {
    padding: Spacing.xs,
    marginLeft: 4,
  },
});