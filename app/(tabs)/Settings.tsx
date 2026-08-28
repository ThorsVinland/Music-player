import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, ThemeMode } from '@/store/themeStore';
import { LanguageCode, useTranslation } from '@/store/languageStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function Settings() {
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const currentColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [switchingTheme, setSwitchingTheme] = useState<ThemeMode | null>(null);
  const [switchingLang, setSwitchingLang] = useState<LanguageCode | null>(null);

  const handleSelectTheme = (mode: ThemeMode) => {
    if (themeMode === mode) return;
    setSwitchingTheme(mode);
    Haptics.selectionAsync().catch(() => {});
    setThemeMode(mode);
    setTimeout(() => {
      setSwitchingTheme(null);
    }, 280);
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    if (language === code) return;
    setSwitchingLang(code);
    Haptics.selectionAsync().catch(() => {});
    setLanguage(code);
    setTimeout(() => {
      setSwitchingLang(null);
    }, 280);
  };

  const ThemeOption = ({
    mode,
    label,
    icon,
  }: {
    mode: ThemeMode;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const isSelected = themeMode === mode;
    const isPending = switchingTheme === mode;

    return (
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: isSelected ? currentColors.primary : 'transparent',
            borderColor: isSelected
              ? currentColors.primary
              : currentColors.glassBorder,
          },
        ]}
        onPress={() => handleSelectTheme(mode)}
        activeOpacity={0.7}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator
            size="small"
            color={isSelected ? '#fff' : currentColors.primary}
            style={styles.optionIcon}
          />
        ) : (
          <Ionicons
            name={icon}
            size={18}
            color={isSelected ? '#fff' : currentColors.text}
            style={styles.optionIcon}
          />
        )}
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#fff' : currentColors.text,
              fontWeight: isSelected ? '700' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const LanguageOption = ({
    code,
    label,
  }: {
    code: LanguageCode;
    label: string;
  }) => {
    const isSelected = language === code;
    const isPending = switchingLang === code;

    return (
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: isSelected ? currentColors.primary : 'transparent',
            borderColor: isSelected
              ? currentColors.primary
              : currentColors.glassBorder,
          },
        ]}
        onPress={() => handleSelectLanguage(code)}
        activeOpacity={0.7}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator
            size="small"
            color={isSelected ? '#fff' : currentColors.primary}
            style={styles.optionIcon}
          />
        ) : null}
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#fff' : currentColors.text,
              fontWeight: isSelected ? '700' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StaticGradientBackground />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.sm, paddingBottom: 155 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>
              {t.settings}
            </Text>
            {(switchingTheme !== null || switchingLang !== null) && (
              <View
                style={[
                  styles.loadingPill,
                  { backgroundColor: currentColors.primaryMuted },
                ]}
              >
                <ActivityIndicator size="small" color={currentColors.primary} />
              </View>
            )}
          </View>

          {/* Theme / Appearance Card */}
          <BlurView
            intensity={isDark ? 25 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.glassCard,
              {
                backgroundColor: currentColors.glassBackground,
                borderColor: currentColors.glassBorder,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, { color: currentColors.text }]}
              >
                {t.appearance}
              </Text>
            </View>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              {t.themeModeSubtitle}
            </Text>

            <View style={styles.optionsRow}>
              <ThemeOption mode="light" label={t.light} icon="sunny-outline" />
              <ThemeOption mode="dark" label={t.dark} icon="moon-outline" />
              <ThemeOption
                mode="system"
                label={t.system}
                icon="settings-outline"
              />
            </View>
          </BlurView>

          {/* Language Card */}
          <BlurView
            intensity={isDark ? 25 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.glassCard,
              {
                backgroundColor: currentColors.glassBackground,
                borderColor: currentColors.glassBorder,
                marginTop: Spacing.md,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, { color: currentColors.text }]}
              >
                {t.language}
              </Text>
            </View>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              {t.languageSubtitle}
            </Text>

            <View style={styles.optionsRow}>
              <LanguageOption code="en" label="English" />
              <LanguageOption code="ar" label="العربية" />
              <LanguageOption code="fr" label="Français" />
            </View>
          </BlurView>

          {/* Library Card */}
          <BlurView
            intensity={isDark ? 25 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.glassCard,
              {
                backgroundColor: currentColors.glassBackground,
                borderColor: currentColors.glassBorder,
                marginTop: Spacing.md,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="library-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, { color: currentColors.text }]}
              >
                {t.collections || 'Library'}
              </Text>
            </View>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              Scan your device to find new music files or remove deleted ones.
            </Text>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: currentColors.primary,
                  borderColor: currentColors.primary,
                },
              ]}
              onPress={() => {
                const { useLibraryStore } = require('@/store/libraryStore');
                useLibraryStore.getState().scanLibrary();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="sync-outline"
                size={18}
                color="#fff"
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: '#fff', fontWeight: '700' }]}>
                Scan Device for Music
              </Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 42,
  },
  optionIcon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 13,
  },
});
