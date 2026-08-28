import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useTranslation } from '@/store/languageStore';
import Home from '@/app/(tabs)/Home';
import PlaylistsScreen from '@/app/(tabs)/Playlists';
import Settings from '@/app/(tabs)/Settings';
import ExpandablePlayerCard from '../player/ExpandablePlayerCard';
import Toast from '../ui/Toast';
import { usePlayerStore } from '@/store/playerStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  key: string;
  titleKey: 'library' | 'playlists' | 'settings';
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

export default function MainPagerView() {
  const pagerRef = useRef<PagerView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const { t } = useTranslation();

  // Toast state for double-back-to-exit
  const [toastVisible, setToastVisible] = useState(false);
  const lastBackPressRef = useRef<number>(0);

  const tabs: TabItem[] = [
    {
      key: 'library',
      titleKey: 'library',
      icon: 'musical-notes',
      iconOutline: 'musical-notes-outline',
    },
    {
      key: 'playlists',
      titleKey: 'playlists',
      icon: 'albums',
      iconOutline: 'albums-outline',
    },
    {
      key: 'settings',
      titleKey: 'settings',
      icon: 'settings-sharp',
      iconOutline: 'settings-outline',
    },
  ];

  const handleTabPress = useCallback(
    (index: number) => {
      if (currentPage === index) return;
      setCurrentPage(index);
      if (Platform.OS === 'web') {
        scrollRef.current?.scrollTo({
          x: index * SCREEN_WIDTH,
          animated: true,
        });
      } else {
        pagerRef.current?.setPage(index);
      }
      Haptics.selectionAsync().catch(() => {});
    },
    [currentPage]
  );

  // Android Double Back to Exit handler
  useEffect(() => {
    const handleBackPress = () => {
      // If we are on a secondary tab, return to first tab (Library)
      if (currentPage !== 0) {
        handleTabPress(0);
        return true;
      }

      // If on the first tab, check time since last back press
      const now = Date.now();
      if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      setToastVisible(true);
      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backSubscription.remove();
  }, [currentPage, handleTabPress]);

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const newPage = e.nativeEvent.position;
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleWebScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex >= 0 && pageIndex < tabs.length && pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Native Swipeable Pager for iOS/Android & ScrollView fallback for Web */}
      {Platform.OS === 'web' ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleWebScrollEnd}
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
      ) : (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageSelected}
          overScrollMode="never"
          scrollEnabled={true}
        >
          <View key="0" style={styles.page}>
            <Home />
          </View>
          <View key="1" style={styles.page}>
            <PlaylistsScreen />
          </View>
          <View key="2" style={styles.page}>
            <Settings />
          </View>
        </PagerView>
      )}

      {/* Floating Solid Mini / Expandable Player Card */}
      {currentSong && <ExpandablePlayerCard />}

      {/* Localized Theme-Aware Exit Toast */}
      <Toast
        visible={toastVisible}
        message={t.pressAgainToExit}
        icon="exit-outline"
        duration={2000}
        onHide={() => setToastVisible(false)}
        bottomOffset={68}
      />

      {/* Solid Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: isDark ? '#0b0f19' : '#ffffff',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            paddingBottom: Math.max(insets.bottom, 8),
            height: 58 + Math.max(insets.bottom, 8),
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
                name={isActive ? tab.icon : tab.iconOutline}
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
                {t[tab.titleKey]}
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
  page: {
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
