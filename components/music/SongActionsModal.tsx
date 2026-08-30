import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  FlatList,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
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
  anchor?: { x: number; y: number; width: number; height: number } | null;
  onClose: () => void;
}

export default function SongActionsModal({ visible, song, anchor, onClose }: Props) {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const deleteSongFromLibrary = useLibraryStore((state) => state.deleteSongFromLibrary);
  const { playlists, addSongToPlaylist } = usePlaylistStore();
  const { t, isRTL } = useTranslation();

  const [infoVisible, setInfoVisible] = useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [menuLayout, setMenuLayout] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (visible && !infoVisible && !playlistPickerVisible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setMenuLayout(null);
    }
  }, [visible, infoVisible, playlistPickerVisible, scaleAnim, opacityAnim]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
      if (callback) callback();
    });
  };

  if (!song) return null;

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleShare = async () => {
    handleClose(async () => {
      try {
        await Share.share({
          title: song.filename,
          message: `Listening to ${song.filename}`,
          url: song.uri,
        });
      } catch (error: any) {
        console.log('Share error:', error.message);
      }
    });
  };

  const handleDelete = () => {
    handleClose(() => {
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
    });
  };

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    addSongToPlaylist(playlistId, song.id);
    setPlaylistPickerVisible(false);
    handleClose(() => {
      Alert.alert(t.addedToPlaylistTitle, `${t.addedToPlaylistMsg} "${playlistName}"`);
    });
  };

  const handleOpenPlaylistPicker = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 120, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => {
      setPlaylistPickerVisible(true);
    });
  };

  const handleOpenInfo = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 120, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => {
      setInfoVisible(true);
    });
  };

  const MENU_WIDTH = 220;
  let top = 0;
  let left = 0;
  const window = Dimensions.get('window');

  if (anchor) {
    left = anchor.x - MENU_WIDTH + anchor.width;
    if (left < 10) left = 10;
    if (left + MENU_WIDTH > window.width - 10) left = window.width - MENU_WIDTH - 10;
    
    top = anchor.y + anchor.height;
    if (menuLayout) {
      if (top + menuLayout.height > window.height - 40) {
        top = anchor.y - menuLayout.height;
      }
      if (top < 40) top = 40;
    } else {
      if (top + 200 > window.height - 40) {
        top = anchor.y - 200;
      }
    }
  } else {
    left = window.width / 2 - MENU_WIDTH / 2;
    top = window.height / 2 - 100;
  }

  return (
    <>
      <Modal
        visible={visible && !infoVisible && !playlistPickerVisible}
        transparent
        animationType="none"
        onRequestClose={() => handleClose()}
      >
        <TouchableWithoutFeedback onPress={() => handleClose()}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          onLayout={(e) => {
            setMenuLayout({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            });
          }}
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: isDark ? '#232b38' : '#ffffff',
              borderColor: currentColors.border,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              top,
              left,
              width: MENU_WIDTH,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleOpenPlaylistPicker}
          >
            <Ionicons
              name="list-circle-outline"
              size={22}
              color={currentColors.primary}
            />
            <Text style={[styles.dropdownItemText, { color: currentColors.text }]}>
              {t.addToPlaylist}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleOpenInfo}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={currentColors.primary}
            />
            <Text style={[styles.dropdownItemText, { color: currentColors.text }]}>
              {t.songInfo}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownItem} onPress={handleShare}>
            <Ionicons
              name="share-social-outline"
              size={22}
              color={currentColors.primary}
            />
            <Text style={[styles.dropdownItemText, { color: currentColors.text }]}>
              {t.share}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
            <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>
              {t.removeFromLibrary}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: Spacing.sm + 2,
  },
  backdropCenter: {
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
