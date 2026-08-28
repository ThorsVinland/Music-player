import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  FlatList,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useTranslation } from '@/store/languageStore';

interface Props {
  visible: boolean;
  song: MediaLibrary.Asset | null;
  onClose: () => void;
}

export default function SongActionsModal({ visible, song, onClose }: Props) {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const deleteSongFromLibrary = useLibraryStore((state) => state.deleteSongFromLibrary);
  const { playlists, addSongToPlaylist } = usePlaylistStore();
  const { t, isRTL } = useTranslation();

  const [infoVisible, setInfoVisible] = useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);

  if (!song) return null;

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleShare = async () => {
    onClose();
    try {
      await Share.share({
        title: song.filename,
        message: `Listening to ${song.filename}`,
        url: song.uri,
      });
    } catch (error: any) {
      console.log('Share error:', error.message);
    }
  };

  const handleDelete = () => {
    onClose();
    Alert.alert(
      t.deleteConfirmTitle,
      t.deleteConfirmMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => deleteSongFromLibrary(song.id),
        },
      ]
    );
  };

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    addSongToPlaylist(playlistId, song.id);
    setPlaylistPickerVisible(false);
    onClose();
    Alert.alert(t.addedToPlaylistTitle, `${t.addedToPlaylistMsg} "${playlistName}"`);
  };

  return (
    <>
      <Modal
        visible={visible && !infoVisible && !playlistPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? '#161f30' : '#ffffff',
                borderColor: currentColors.border,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: currentColors.textSecondary },
                ]}
              />
              <Text
                style={[styles.songTitleHeader, { color: currentColors.text }]}
                numberOfLines={1}
              >
                {song.filename}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setPlaylistPickerVisible(true)}
            >
              <Ionicons
                name="list-circle-outline"
                size={24}
                color={currentColors.primary}
              />
              <Text style={[styles.actionText, { color: currentColors.text }]}>
                {t.addToPlaylist}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setInfoVisible(true)}
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={currentColors.primary}
              />
              <Text style={[styles.actionText, { color: currentColors.text }]}>
                {t.songInfo}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color={currentColors.primary}
              />
              <Text style={[styles.actionText, { color: currentColors.text }]}>
                {t.share}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.deleteItem]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>
                {t.removeFromLibrary}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Playlist Picker Modal */}
      <Modal
        visible={playlistPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaylistPickerVisible(false)}
      >
        <View style={styles.backdropCenter}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#161f30' : '#ffffff',
                borderColor: currentColors.border,
                maxHeight: '60%',
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: currentColors.text }]}>
              {t.selectPlaylist}
            </Text>

            <FlatList
              data={playlists}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistOption}
                  onPress={() => handleAddToPlaylist(item.id, item.name)}
                >
                  <Ionicons
                    name={item.id === 'favorites_smart' ? 'heart' : 'musical-notes'}
                    size={22}
                    color={currentColors.primary}
                  />
                  <Text
                    style={[
                      styles.playlistOptionText,
                      {
                        color: currentColors.text,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: currentColors.primary },
              ]}
              onPress={() => setPlaylistPickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Song Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.backdropCenter}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#161f30' : '#ffffff',
                borderColor: currentColors.border,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: currentColors.text }]}>
              {t.songMetadata}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: currentColors.textSecondary }]}>
                {t.titleLabel}
              </Text>
              <Text
                style={[styles.metaValue, { color: currentColors.text }]}
                numberOfLines={2}
              >
                {song.filename}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: currentColors.textSecondary }]}>
                {t.durationLabel}
              </Text>
              <Text style={[styles.metaValue, { color: currentColors.text }]}>
                {formatDuration(song.duration)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: currentColors.textSecondary }]}>
                {t.locationLabel}
              </Text>
              <Text
                style={[styles.metaValue, { color: currentColors.text }]}
                numberOfLines={2}
              >
                {song.uri}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: currentColors.primary },
              ]}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.md,
    opacity: 0.4,
  },
  songTitleHeader: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: Spacing.md,
  },
  infoCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  metaRow: {
    marginVertical: Spacing.xs,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  playlistOptionText: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: Spacing.md,
  },
});
