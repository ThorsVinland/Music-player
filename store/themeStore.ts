import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useTheme = () => {
  const { themeMode } = useThemeStore();
  const systemTheme = useColorScheme();
  
  const isDark = themeMode === 'system' ? systemTheme === 'dark' : themeMode === 'dark';
  return { isDark, themeMode, setThemeMode: useThemeStore.getState().setThemeMode };
};
