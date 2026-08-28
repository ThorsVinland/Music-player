import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { usePlayerStore } from './playerStore';

const CACHE_KEY = '@music_player_songs_cache_v3';

export type Song = MediaLibrary.Asset & { formattedDuration?: string };

interface LibraryState {
  songs: Song[];
  loading: boolean;
  isScanning: boolean;
  hasLoadedCache: boolean;
  loadSongs: () => Promise<void>;
  scanLibrary: () => Promise<void>;
  deleteSongFromLibrary: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  loading: true,
  isScanning: false,
  hasLoadedCache: false,

  loadSongs: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedSongs: MediaLibrary.Asset[] = JSON.parse(cached);
        // Even if the cache is empty, we respect it. Only scan if cache is completely missing.
        set({ songs: parsedSongs, loading: false, hasLoadedCache: true });
        usePlayerStore.getState().setPlaylist(parsedSongs);
        return;
      }
    } catch (e) {
      console.log('Error loading cached songs:', e);
    }

    // Only on absolute first launch (cache missing) do we auto-scan
    await get().scanLibrary();
  },

  scanLibrary: async () => {
    set({ isScanning: true });
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access audio files was denied!');
        set({ isScanning: false, loading: false });
        return;
      }

      let allSongs: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;

      while (hasNextPage) {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'audio',
          first: 1000,
          after,
        });

        allSongs = [...allSongs, ...media.assets];
        hasNextPage = media.hasNextPage;
        after = media.endCursor;
      }

      const sorted: Song[] = allSongs.sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' })
      ).map(song => {
        const mins = Math.floor(song.duration / 60);
        const secs = Math.floor(song.duration % 60);
        const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        return { ...song, formattedDuration };
      });

      // Save to local storage cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sorted));

      set({ songs: sorted, loading: false, isScanning: false, hasLoadedCache: true });
      usePlayerStore.getState().setPlaylist(sorted);
    } catch (error) {
      console.log('Error scanning library:', error);
      set({ isScanning: false, loading: false });
    }
  },

  deleteSongFromLibrary: async (id: string) => {
    const { songs } = get();
    const updated = songs.filter((s) => s.id !== id);
    set({ songs: updated });
    usePlayerStore.getState().setPlaylist(updated);
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Error updating cache after delete:', e);
    }
  },
}));
