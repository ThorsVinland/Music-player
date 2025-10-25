import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function StaticGradientBackground() {
    return (
        <LinearGradient
            colors={['#15575cff', '#000a25ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
        />
    );
}