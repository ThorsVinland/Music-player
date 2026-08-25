import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import Home from '@/app/(tabs)/Home';
import PlaylistsScreen from '@/app/(tabs)/Playlists';
import Settings from '@/app/(tabs)/Settings';
import ExpandablePlayerCard from '../player/ExpandablePlayerCard';
import { usePlayerStore } from '@/store/playerStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MainPagerView() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const currentSong = usePlayerStore((state) => state.currentSong);

  const tabs = [
    { key: 'library', title: 'Library', icon: 'musical-notes' },
    { key: 'playlists', title: 'Collections', icon: 'albums' },
    { key: 'settings', title: 'Settings', icon: 'settings-sharp' },
  ];

  const handleTabPress = (index: number) => {
    setCurrentPage(index);
    scrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex >= 0 && pageIndex < tabs.length && pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1:1 Real-time Gesture Horizontal Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.pager}
      >
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <Home />
        </View>

        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <PlaylistsScreen />
        </View>

        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <Settings />
        </View>
      </ScrollView>

      {/* Floating Solid Mini / Expandable Player Card */}
      {currentSong && <ExpandablePlayerCard />}

      {/* Solid Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopColor: isDark ? '#334155' : '#e2e8f0',
            paddingBottom: Math.max(insets.bottom, 10),
            height: 56 + Math.max(insets.bottom, 10),
          },
        ]}
      >
        {tabs.map((tab, idx) => {
          const isActive = currentPage === idx;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(idx)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={
                  isActive
                    ? currentColors.primary
                    : currentColors.tabIconDefault
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? currentColors.primary
                      : currentColors.tabIconDefault,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
});
