import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, ThemeMode } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function Settings() {
    const { isDark, themeMode, setThemeMode } = useTheme();
    const currentColors = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();

    const ThemeOption = ({ mode, label, icon }: { mode: ThemeMode, label: string, icon: keyof typeof Ionicons.glyphMap }) => {
        const isSelected = themeMode === mode;
        
        return (
            <TouchableOpacity 
                style={[
                    styles.optionButton, 
                    { 
                        backgroundColor: isSelected ? currentColors.primary : 'transparent',
                        borderColor: isSelected ? currentColors.primary : currentColors.glassBorder
                    }
                ]} 
                onPress={() => setThemeMode(mode)}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={icon} 
                    size={20} 
                    color={isSelected ? '#fff' : currentColors.text} 
                    style={styles.optionIcon}
                />
                <Text style={[
                    styles.optionText,
                    { color: isSelected ? '#fff' : currentColors.text }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StaticGradientBackground />
            
            <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
                <Text style={[styles.headerTitle, { color: currentColors.text }]}>Settings</Text>
                
                <BlurView 
                    intensity={isDark ? 30 : 60} 
                    tint={isDark ? 'dark' : 'light'} 
                    style={[
                        styles.glassCard, 
                        { 
                            backgroundColor: currentColors.glassBackground,
                            borderColor: currentColors.glassBorder
                        }
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="color-palette-outline" size={24} color={currentColors.primary} />
                        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Appearance</Text>
                    </View>
                    
                    <Text style={[styles.sectionSubtitle, { color: currentColors.textSecondary }]}>
                        Choose your preferred theme mode
                    </Text>
                    
                    <View style={styles.optionsRow}>
                        <ThemeOption mode="light" label="Light" icon="sunny-outline" />
                        <ThemeOption mode="dark" label="Dark" icon="moon-outline" />
                        <ThemeOption mode="system" label="System" icon="settings-outline" />
                    </View>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: Spacing.xl,
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
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: Spacing.sm,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: Spacing.lg,
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
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    optionIcon: {
        marginRight: 6,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
