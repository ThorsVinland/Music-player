import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';

export default function PlayerScreen() {
    const { isDark } = useTheme();
    const currentColors = isDark ? Colors.dark : Colors.light;
    const { 
        currentSong, 
        isPlaying, 
        position, 
        duration, 
        playNext, 
        playPrevious, 
        currentUri,
        isShuffle,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        favorites,
        toggleFavorite,
        currentIndex,
        playlist
    } = usePlayerStore();
    const { togglePlay, handleSeek } = useGlobalAudio();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const currentSongItem = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
    const isFav = currentSongItem ? favorites.includes(currentSongItem.id) : false;
    
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

    return (
        <View style={styles.container}>
            <StaticGradientBackground />
            
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="chevron-down" size={32} color={currentColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: currentColors.textSecondary }]}>Now Playing</Text>
                {currentSongItem ? (
                    <TouchableOpacity 
                        onPress={() => toggleFavorite(currentSongItem.id)} 
                        style={styles.iconButton}
                    >
                        <Ionicons 
                            name={isFav ? "heart" : "heart-outline"} 
                            size={26} 
                            color={isFav ? currentColors.primary : currentColors.text} 
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}
            </View>

            <View style={styles.artworkContainer}>
                <Image
                    source={
                        currentUri?.endsWith(".mp3")
                            ? require("@/assets/images/music.png")
                            : { uri: currentUri || undefined }
                    }
                    style={[styles.artwork, { borderColor: currentColors.glassBorder }]}
                />
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.songTitle, { color: currentColors.text }]} numberOfLines={2}>
                    {currentSong || "Unknown Track"}
                </Text>
                <Text style={[styles.artistName, { color: currentColors.primary }]} numberOfLines={1}>
                    Unknown Artist
                </Text>
            </View>

            <View style={styles.progressContainer}>
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

            <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
                <TouchableOpacity onPress={toggleShuffle} style={styles.controlButton}>
                    <Ionicons 
                        name="shuffle" 
                        size={26} 
                        color={isShuffle ? currentColors.primary : currentColors.textSecondary} 
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={playPrevious} style={styles.mainControlButton}>
                    <Ionicons name="play-skip-back" size={36} color={currentColors.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={togglePlay} 
                    style={[styles.playButton, { backgroundColor: currentColors.primary }]}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={42}
                        color="#fff"
                        style={{ marginLeft: isPlaying ? 0 : 4 }}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={playNext} style={styles.mainControlButton}>
                    <Ionicons name="play-skip-forward" size={36} color={currentColors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} style={styles.controlButton}>
                    <Ionicons 
                        name={repeatMode === 'one' ? "repeat-outline" : "repeat"} 
                        size={26} 
                        color={repeatMode !== 'off' ? currentColors.primary : currentColors.textSecondary} 
                    />
                    {repeatMode === 'one' && (
                        <Text style={{ position: 'absolute', top: 12, right: 6, fontSize: 9, fontWeight: 'bold', color: currentColors.primary }}>1</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
    },
    iconButton: {
        padding: Spacing.sm,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    artworkContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    artwork: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    infoContainer: {
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    songTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    artistName: {
        fontSize: 18,
        fontWeight: '500',
    },
    progressContainer: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -10,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    controlButton: {
        padding: Spacing.sm,
    },
    mainControlButton: {
        padding: Spacing.sm,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
});
