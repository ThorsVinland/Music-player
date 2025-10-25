import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
} from 'react-native';
import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type MiniPlayerProps = {
    currentSong: string | null;
    isPlaying: boolean;
    artwork?: string;
    onTogglePlay: () => void;
}

export default function MiniPlayer({ currentSong, isPlaying, artwork, onTogglePlay }: MiniPlayerProps) {

    if (!currentSong) return null;

    return (
        <LinearGradient
            colors={["#0aa6b1cc", "#000000dd"]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View style={styles.infoContainer}>
                <Image
                    source={
                        artwork
                            ? { uri: artwork }
                            : require("@/assets/images/music.png")
                    }
                    style={styles.artwork}
                />
                <Text
                    style={styles.title}
                    numberOfLines={1}
                >
                    {currentSong}
                </Text>
            </View>
            <TouchableOpacity onPress={onTogglePlay}>
                <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={28}
                    color="white"
                />
            </TouchableOpacity>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
    },
    artwork: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    title: {
        color: "white",
        marginLeft: 10,
        fontSize: 14,
        flexShrink: 1,
    },
})