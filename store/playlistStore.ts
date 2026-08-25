import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  renamePlaylist: (id: string, newName: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [
        {
          id: 'favorites_smart',
          name: 'My Favorites',
          songIds: [],
          createdAt: Date.now(),
        },
      ],

      createPlaylist: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newPlaylist: Playlist = {
          id: 'pl_' + Date.now(),
          name: trimmed,
          songIds: [],
          createdAt: Date.now(),
        };
        set({ playlists: [newPlaylist, ...get().playlists] });
      },

      deletePlaylist: (id: string) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },

      addSongToPlaylist: (playlistId: string, songId: string) => {
        const { playlists } = get();
        const updated = playlists.map((p) => {
          if (p.id === playlistId && !p.songIds.includes(songId)) {
            return { ...p, songIds: [...p.songIds, songId] };
          }
          return p;
        });
        set({ playlists: updated });
      },

      removeSongFromPlaylist: (playlistId: string, songId: string) => {
        const { playlists } = get();
        const updated = playlists.map((p) => {
          if (p.id === playlistId) {
            return { ...p, songIds: p.songIds.filter((id) => id !== songId) };
          }
          return p;
        });
        set({ playlists: updated });
      },

      renamePlaylist: (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        const { playlists } = get();
        const updated = playlists.map((p) =>
          p.id === id ? { ...p, name: trimmed } : p
        );
        set({ playlists: updated });
      },
    }),
    {
      name: 'playlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
