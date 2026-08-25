import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaylistStore, Playlist } from '@/store/playlistStore';
import { usePlayerStore } from '@/store/playerStore';
import * as MediaLibrary from 'expo-media-library';

type SubTab = 'playlists' | 'albums' | 'favorites';

export default function PlaylistsScreen() {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<SubTab>('playlists');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  const { songs } = useLibraryStore();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const { favorites, toggleFavorite, playSong, currentSong } = usePlayerStore();

  // Group songs by Album / Folder
  const albumsMap = useMemo(() => {
    const map: Record<string, MediaLibrary.Asset[]> = {};
    songs.forEach((song) => {
      // derive album or folder name
      let albumName = 'Unknown Album';
      if (song.uri) {
        const parts = song.uri.split('/');
        if (parts.length > 2) {
          albumName = decodeURIComponent(parts[parts.length - 2]);
        }
      }
      if (!map[albumName]) {
        map[albumName] = [];
      }
      map[albumName].push(song);
    });
    return map;
  }, [songs]);

  const albumList = useMemo(() => {
    return Object.keys(albumsMap).map((albumName) => ({
      name: albumName,
      count: albumsMap[albumName].length,
      sampleSong: albumsMap[albumName][0],
    }));
  }, [albumsMap]);

  // Favorite songs list
  const favoriteSongs = useMemo(() => {
    return songs.filter((s) => favorites.includes(s.id));
  }, [songs, favorites]);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setCreateModalVisible(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlaylist(playlist.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StaticGradientBackground />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>
            Collections
          </Text>

          {activeTab === 'playlists' && (
            <TouchableOpacity
              style={[
                styles.createBtn,
                {
                  backgroundColor: currentColors.primary,
                },
              ]}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Selector */}
        <View
          style={[
            styles.tabSelector,
            {
              backgroundColor: currentColors.glassBackground,
              borderColor: currentColors.glassBorder,
            },
          ]}
        >
          {(['playlists', 'albums', 'favorites'] as SubTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  isSelected && {
                    backgroundColor: currentColors.primary,
                  },
                ]}
                onPress={() => {
                  setActiveTab(tab);
                  setSelectedPlaylist(null);
                  setSelectedAlbum(null);
                }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: isSelected ? '#fff' : currentColors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ============================================================ */}
      {/* 1. PLAYLISTS TAB                                             */}
      {/* ============================================================ */}
      {activeTab === 'playlists' && (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const isSmartFav = item.id === 'favorites_smart';
            const count = isSmartFav ? favorites.length : item.songIds.length;

            return (
              <TouchableOpacity
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: currentColors.glassBackground,
                    borderColor: currentColors.glassBorder,
                  },
                ]}
                onPress={() => {
                  if (isSmartFav) {
                    setActiveTab('favorites');
                  }
                }}
                onLongPress={() => {
                  if (!isSmartFav) handleDeletePlaylist(item);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIconBox,
                    {
                      backgroundColor: isSmartFav
                        ? currentColors.primary + '25'
                        : isDark
                        ? '#334155'
                        : '#e2e8f0',
                    },
                  ]}
                >
                  <Ionicons
                    name={isSmartFav ? 'heart' : 'musical-notes'}
                    size={26}
                    color={isSmartFav ? currentColors.primary : currentColors.text}
                  />
                </View>

                <View style={styles.cardInfo}>
                  <Text
                    style={[styles.cardTitle, { color: currentColors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    {count} {count === 1 ? 'song' : 'songs'}
                  </Text>
                </View>

                {!isSmartFav && (
                  <TouchableOpacity
                    onPress={() => handleDeletePlaylist(item)}
                    style={styles.deletePlaylistBtn}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={currentColors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ============================================================ */}
      {/* 2. ALBUMS TAB                                                */}
      {/* ============================================================ */}
      {activeTab === 'albums' && (
        <FlatList
          data={albumList}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={{ padding: Spacing.sm, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.albumGridCard,
                {
                  backgroundColor: currentColors.glassBackground,
                  borderColor: currentColors.glassBorder,
                },
              ]}
              onPress={() => {
                const albumSongs = albumsMap[item.name];
                if (albumSongs && albumSongs.length > 0) {
                  playSong(albumSongs[0]);
                }
              }}
              activeOpacity={0.8}
            >
              <Image
                source={
                  item.sampleSong?.uri?.endsWith('.mp3')
                    ? require('@/assets/images/music.png')
                    : { uri: item.sampleSong?.uri }
                }
                style={styles.albumArtwork}
              />
              <Text
                style={[styles.albumTitle, { color: currentColors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.albumCount,
                  { color: currentColors.textSecondary },
                ]}
              >
                {item.count} {item.count === 1 ? 'Track' : 'Tracks'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ============================================================ */}
      {/* 3. FAVORITES TAB                                             */}
      {/* ============================================================ */}
      {activeTab === 'favorites' && (
        <FlatList
          data={favoriteSongs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons
                name="heart-dislike-outline"
                size={54}
                color={currentColors.icon}
              />
              <Text
                style={[styles.emptyTitle, { color: currentColors.text }]}
              >
                No Favorites Yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: currentColors.textSecondary },
                ]}
              >
                Tap the heart icon on any song to add it to your favorites.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = currentSong === item.filename;
            return (
              <TouchableOpacity
                style={[
                  styles.songRow,
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
                activeOpacity={0.7}
              >
                <Image
                  source={
                    item?.uri?.endsWith('.mp3')
                      ? require('@/assets/images/music.png')
                      : { uri: item.uri }
                  }
                  style={styles.songArtwork}
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
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  style={{ padding: Spacing.xs }}
                >
                  <Ionicons
                    name="heart"
                    size={22}
                    color={currentColors.primary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.createCard,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: currentColors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              Create New Playlist
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                  color: currentColors.text,
                  borderColor: currentColors.border,
                },
              ]}
              placeholder="Playlist name..."
              placeholderTextColor={currentColors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: currentColors.border }]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: currentColors.primary },
                ]}
                onPress={handleCreatePlaylist}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 13,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  deletePlaylistBtn: {
    padding: Spacing.sm,
  },
  albumGridCard: {
    flex: 1,
    margin: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  albumArtwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  albumCount: {
    fontSize: 12,
    marginTop: 2,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  songArtwork: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  songInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  songTitle: {
    fontSize: 15,
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  createCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  modalInput: {
    height: 46,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
