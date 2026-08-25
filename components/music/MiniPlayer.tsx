import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { usePlayerStore } from "@/store/playerStore";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { useTheme } from "@/store/themeStore";
import { Colors, Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";

export default function MiniPlayer() {
    const { currentSong, isPlaying, position, duration, playNext, playPrevious } = usePlayerStore();
    const { togglePlay, handleSeek } = useGlobalAudio();
    const { isDark } = useTheme();
    const currentColors = isDark ? Colors.dark : Colors.light;
    const router = useRouter();

    const insets = useSafeAreaInsets();
    const [isSeeking, setIsSeeking] = React.useState(false);
    const [seekValue, setSeekValue] = React.useState(0);

    React.useEffect(() => {
        if (!isSeeking) {
            setSeekValue(position);
        }
    }, [position, isSeeking]);

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    if (!currentSong) return null;

    return (
        <View style={[styles.container, { 
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopColor: currentColors.glassBorder
        }]}>
            <View style={styles.contentRow}>
                <TouchableOpacity 
                    style={styles.infoContainer} 
                    onPress={() => router.push('/player')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.songTitle, { color: currentColors.text }]} numberOfLines={1}>
                        {currentSong}
                    </Text>
                </TouchableOpacity>

                <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
                        <Ionicons name="play-skip-back" size={24} color={currentColors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={28}
                            color={currentColors.primary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext} style={styles.controlButton}>
                        <Ionicons name="play-skip-forward" size={24} color={currentColors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={seekValue}
                onValueChange={(val) => {
                    if (!isSeeking) setIsSeeking(true);
                    setSeekValue(val);
                }}
                onSlidingComplete={(val) => {
                    setIsSeeking(false);
                    handleSeek(val);
                }}
                minimumTrackTintColor={currentColors.primary}
                maximumTrackTintColor={currentColors.glassBorder}
                thumbTintColor={currentColors.primary}
            />

            <View style={styles.timeRow}>
                <Text style={[styles.timeText, { color: currentColors.textSecondary }]}>{formatTime(seekValue)}</Text>
                <Text style={[styles.timeText, { color: currentColors.textSecondary }]}>{formatTime(duration)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    infoContainer: {
        flex: 1,
        marginRight: Spacing.md,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    controlButton: {
        padding: 4,
    },
    playButton: {
        padding: 4,
    },
    slider: {
        width: "100%",
        height: 30,
        marginTop: -4,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -8,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 11,
    },
});