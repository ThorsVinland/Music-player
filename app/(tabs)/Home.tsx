import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import MusicList from '@/components/music/MusicList';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@/store/libraryStore';

export default function Home() {
  const { isDark } = useTheme();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { isScanning, scanLibrary } = useLibraryStore();

  return (
    <View style={styles.container}>
      <StaticGradientBackground />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>
              Music Library
            </Text>
            <Text style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}>
              All Songs
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: currentColors.glassBackground,
                borderColor: currentColors.glassBorder,
              },
            ]}
            onPress={scanLibrary}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={currentColors.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={currentColors.primary} />
                <Text style={[styles.scanButtonText, { color: currentColors.primary }]}>
                  Scan
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: currentColors.glassBackground,
              borderColor: currentColors.glassBorder,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={currentColors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: currentColors.text }]}
            placeholder="Search songs, titles, files..."
            placeholderTextColor={currentColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={currentColors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <MusicList searchQuery={searchQuery} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  scanButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
});