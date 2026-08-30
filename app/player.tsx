import { View, Text, StyleSheet, Image, Dimensions, PixelRatio } from 'react-native';
import { Gesture, GestureDetector, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '@/store/themeStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ~2cm threshold, density-aware
// لا تضرب بـ PixelRatio.get() لأن dp مستقلة عن الكثافة أصلاً
const BASE_DPI = 160;
const CM_TO_INCH = 0.393701;
const DISMISS_THRESHOLD = 1 * CM_TO_INCH * BASE_DPI; // ≈ 63 dp للـ 1cm

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

    // --- Animation setup (Reanimated) ---
    const translateY = useSharedValue(0);
    const isClosing = useSharedValue(false);

    const handleClosePress = () => {
        if (isClosing.value) return;
        isClosing.value = true;
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
            if (finished) {
                runOnJS(router.back)();
            }
        });
    };

    const panGesture = Gesture.Pan()
        .activeOffsetY(10) // Require 10px downward movement to activate
        .failOffsetX([-20, 20]) // Fail if mostly horizontal (allows Slider to work)
        .onUpdate((event) => {
            if (isClosing.value) return;
            // Follow the finger 1:1, don't allow dragging upward past 0
            const dy = Math.max(0, event.translationY);
            translateY.value = dy;
            
            console.log('[DISMISS DEBUG] onUpdate:', {
                rawDy: event.translationY,
                clampedDy: dy,
            });
        })
        .onEnd((event) => {
            if (isClosing.value) return;
            const dy = Math.max(0, event.translationY);
            const vy = event.velocityY; // Note: Reanimated velocity is in px/sec, so 500 is roughly equivalent to PanResponder's 0.5
            
            console.log('[DISMISS DEBUG] onEnd:', {
                rawDy: event.translationY,
                clampedDy: dy,
                threshold: DISMISS_THRESHOLD,
                vy: vy,
                willClose: dy > DISMISS_THRESHOLD || vy > 500,
            });

            if (dy > DISMISS_THRESHOLD || vy > 500) {
                isClosing.value = true;
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 150 }, (finished) => {
                    if (finished) runOnJS(router.back)();
                });
            } else {
                translateY.value = withSpring(0, {
                    stiffness: 400,
                    damping: 30,
                });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
            <StaticGradientBackground />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <TouchableOpacity onPress={handleClosePress} style={styles.iconButton}>
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
            </Animated.View>
        </GestureDetector>
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