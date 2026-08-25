import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/store/themeStore";
import { Colors } from "@/constants/theme";

export default function StaticGradientBackground() {
    const { isDark } = useTheme();
    const colors = isDark 
        ? [Colors.dark.background, '#1e1b4b'] // Dark gradient (obsidian to deep purple-indigo)
        : [Colors.light.background, '#fbcfe8']; // Light gradient (slate to soft pink)

    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
        />
    );
}