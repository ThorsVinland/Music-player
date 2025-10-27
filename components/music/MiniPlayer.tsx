import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    currentSong: string | null;
    isPlaying: boolean;
    onTogglePlay: () => Promise<void>;
    position: number;
    duration: number;
}

export default function MiniPlayer({
    currentSong,
    isPlaying,
    onTogglePlay,
    position,
    duration,
}: Props) {

    // تحويل المدة إلى صيغة دقيقة:ثانية
    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <View style={styles.container}>
            {/* اسم الأغنية */}
            <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong || "لا توجد أغنية مشغلة"}
            </Text>

            {/* شريط الوقت */}
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#555"
                thumbTintColor="#1DB954"
            />

            {/* الوقت الحالي والإجمالي */}
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* زر التشغيل/الإيقاف */}
            <TouchableOpacity onPress={onTogglePlay} style={styles.playButton}>
                <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={28}
                    color="white"
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    songTitle: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 6,
    },
    slider: {
        width: "100%",
        height: 30,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    timeText: {
        color: "#ccc",
        fontSize: 12,
    },
    playButton: {
        alignSelf: "center",
        marginTop: 4,
    },
});