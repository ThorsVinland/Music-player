import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false, presentation: 'modal', gestureEnabled: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
