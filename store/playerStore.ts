import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { audioService } from '@/services/audioService';

interface PlayerState {
  currentSong: string | null;
  currentUri: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playlist: MediaLibrary.Asset[];
  currentIndex: number;
  favorites: string[];
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  
  setCurrentSong: (song: string | null) => void;
  setCurrentUri: (uri: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setPlaylist: (playlist: MediaLibrary.Asset[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  playSongAtIndex: (index: number) => void;
  playSong: (song: MediaLibrary.Asset) => void;
  togglePlay: () => void;
  seekTo: (positionMillis: number) => void;
  toggleFavorite: (id: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      currentUri: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      playlist: [],
      currentIndex: -1,
      favorites: [],
      isShuffle: false,
      repeatMode: 'off',

      setCurrentSong: (song) => set({ currentSong: song }),
      setCurrentUri: (uri) => {
        set({ currentUri: uri, isPlaying: true });
        if (uri) {
          audioService.playUri(uri);
        }
      },
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),
      setPlaylist: (playlist) => set({ playlist }),
      
      playSong: (song: MediaLibrary.Asset) => {
        const { playlist } = get();
        const index = playlist.findIndex((s) => s.id === song.id);
        set({ 
          currentIndex: index !== -1 ? index : 0, 
          currentSong: song.filename, 
          currentUri: song.uri,
          isPlaying: true,
          position: 0,
        });
        audioService.playUri(song.uri);
      },

      playSongAtIndex: (index) => {
        const { playlist } = get();
        if (index >= 0 && index < playlist.length) {
          const song = playlist[index];
          set({ 
            currentIndex: index, 
            currentSong: song.filename, 
            currentUri: song.uri,
            isPlaying: true,
            position: 0,
          });
          audioService.playUri(song.uri);
        }
      },

      togglePlay: () => {
        audioService.togglePlay();
      },

      seekTo: (positionMillis: number) => {
        audioService.seekTo(positionMillis);
      },

      playNext: () => {
        const { currentIndex, playlist, isShuffle, playSongAtIndex } = get();
        if (playlist.length === 0) return;
        
        if (isShuffle && playlist.length > 1) {
          let randomIndex = Math.floor(Math.random() * playlist.length);
          while (randomIndex === currentIndex && playlist.length > 1) {
            randomIndex = Math.floor(Math.random() * playlist.length);
          }
          playSongAtIndex(randomIndex);
        } else {
          const nextIndex = (currentIndex + 1) % playlist.length;
          playSongAtIndex(nextIndex);
        }
      },

      playPrevious: () => {
        const { currentIndex, playlist, playSongAtIndex } = get();
        if (playlist.length === 0) return;
        const prevIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1;
        playSongAtIndex(prevIndex);
      },

      toggleFavorite: (id) => {
        const { favorites } = get();
        if (favorites.includes(id)) {
          set({ favorites: favorites.filter((favId) => favId !== id) });
        } else {
          set({ favorites: [...favorites, id] });
        }
      },

      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
      
      toggleRepeat: () => set((state) => {
        const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
        const currentIndex = modes.indexOf(state.repeatMode);
        return { repeatMode: modes[(currentIndex + 1) % modes.length] };
      }),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
      }),
    }
  )
);
