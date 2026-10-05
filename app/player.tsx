import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { useTranslation } from '@/store/languageStore';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import VinylPlayer from '@/components/music/VinylPlayer';
import Tonearm from '@/components/music/Tonearm';

// ───────────── أحجام النصوص ─────────────
const TITLE_SIZE = 15;
const SUBTITLE_SIZE = 11;
const LABEL_SIZE = 8;

// ───────────── إعدادات عامة ─────────────
const DISMISS_THRESHOLD = 95;
const SHOW_PROGRESS = true; // الشريط الرفيع للتقديم (غير موجود في الصورة، اجعله false لحذفه)

export default function PlayerScreen() {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const INK = c.text;
  const INK_SOFT = c.textSecondary;
  const styles = React.useMemo(() => makeStyles(c), [isDark]);
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

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
    playlist,
  } = usePlayerStore();
  const { togglePlay, handleSeek } = useGlobalAudio();

  const currentSongItem =
    currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
  const isFav = currentSongItem ? favorites.includes(currentSongItem.id) : false;

  // ───────────── الهندسة (القرص + الذراع) ─────────────
  const D = W * 0.82; // قطر القرص
  const discLeft = -W * 0.04; // يخرج قليلاً من الحافة اليسرى
  const armTop = insets.top + 56 + H * 0.02; // مرجع موضع الذراع (ثابت)
  const DISC_DROP = D * 0.12; // مقدار إنزال القرص عن الذراع (زِد الرقم لإنزاله أكثر)
  const discTop = armTop + DISC_DROP;
  const pivotSize = W * 0.12;
  const armLength = D * 0.78;
  const pivotX = discLeft + D * 0.87; // أعلى اليمين
  const pivotY = armTop + D * 0.08;

  // ───────────── التقديم ─────────────
  const [isSeeking, setIsSeeking] = React.useState(false);
  const [seekValue, setSeekValue] = React.useState(0);
  const [barW, setBarW] = React.useState(0);

  React.useEffect(() => {
    if (!isSeeking) setSeekValue(position);
  }, [position, isSeeking]);

  const ratioFromX = (x: number) =>
    barW > 0 ? Math.min(Math.max(x / barW, 0), 1) : 0;
  const beginSeek = (x: number) => {
    setIsSeeking(true);
    setSeekValue(ratioFromX(x) * duration);
  };
  const updateSeek = (x: number) => setSeekValue(ratioFromX(x) * duration);
  const endSeek = (x: number) => {
    const v = ratioFromX(x) * duration;
    setSeekValue(v);
    setIsSeeking(false);
    handleSeek(v);
  };

  const seekGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(beginSeek)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(updateSeek)(e.x);
    })
    .onEnd((e) => {
      runOnJS(endSeek)(e.x);
    });

  const progressPct = duration > 0 ? Math.min((seekValue / duration) * 100, 100) : 0;

  const formatTime = (millis: number) => {
    const s = Math.floor(millis / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // ───────────── السحب للأسفل للإغلاق ─────────────
  const translateY = useSharedValue(0);
  const isClosing = useSharedValue(false);
  const goBack = () => router.back();

  const handleClose = () => {
    if (isClosing.value) return;
    isClosing.value = true;
    translateY.value = withTiming(H, { duration: 200 }, (finished) => {
      if (finished) runOnJS(goBack)();
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-25, 25])
    .onUpdate((e) => {
      if (isClosing.value) return;
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (isClosing.value) return;
      const dy = Math.max(0, e.translationY);
      if (dy > DISMISS_THRESHOLD || e.velocityY > 600) {
        isClosing.value = true;
        translateY.value = withTiming(H, { duration: 160 }, (finished) => {
          if (finished) runOnJS(goBack)();
        });
      } else {
        translateY.value = withSpring(0, { stiffness: 400, damping: 30 });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ───────────── النصوص ─────────────
  const title = (currentSong || 'Unknown Track').replace(/\.[^/.]+$/, '');

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <StaticGradientBackground />

      {/* القرص */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: discLeft, top: discTop, width: D, height: D }}
      >
        <VinylPlayer
          size={D}
          artworkSource={
            currentUri?.endsWith('.mp3')
              ? require('@/assets/images/music.png')
              : { uri: currentUri || undefined }
          }
          isPlaying={isPlaying}
          accentColor={c.primary}
        />
      </View>

      {/* الذراع */}
      <Tonearm
        pivotX={pivotX}
        pivotY={pivotY}
        pivotSize={pivotSize}
        armLength={armLength}
        isPlaying={isPlaying}
        accentColor={c.primary}
        ringColor={c.border}
        onPlayStateChange={(shouldPlay) => {
          if (shouldPlay !== isPlaying) togglePlay();
        }}
      />

      {/* الشريط العلوي (سحب للإغلاق) */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={26} color={INK} />
          </TouchableOpacity>

          {currentSongItem ? (
            <TouchableOpacity
              onPress={() => toggleFavorite(currentSongItem.id)}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={INK}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
      </GestureDetector>

      {/* الجزء السفلي: النص + التقدم + الأزرار */}
      <View
        style={[
          styles.bottom,
          { paddingHorizontal: W * 0.09, paddingBottom: Math.max(insets.bottom, 12) + 28 },
        ]}
      >
        {/* العنوان + اسم الفنان (يسار) */}
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: INK }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: INK_SOFT }]} numberOfLines={1}>
              {t.audioFile} • {t.musicPlayer}
            </Text>
          </View>

          <View style={styles.miniIcons}>
            <TouchableOpacity
              onPress={toggleShuffle}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons name="shuffle" size={16} color={INK} style={{ opacity: isShuffle ? 1 : 0.3 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleRepeat}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                size={16}
                color={INK}
                style={{ opacity: repeatMode !== 'off' ? 1 : 0.3 }}
              />
              {repeatMode === 'one' && <Text style={styles.repeatBadge}>1</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* شريط التقدم الرفيع */}
        {SHOW_PROGRESS && (
          <View style={{ marginTop: 14 }}>
            <GestureDetector gesture={seekGesture}>
              <View
                style={styles.barHit}
                onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)}
              >
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${progressPct}%` }]} />
                </View>
              </View>
            </GestureDetector>
            <View style={styles.timeRow}>
              <Text style={[styles.time, { color: INK_SOFT }]}>{formatTime(seekValue)}</Text>
              <Text style={[styles.time, { color: INK_SOFT }]}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {/* الأزرار البيضاوية */}
        <View style={styles.controlsRow}>
          <PillButton
            onPress={togglePlay}
            label={isPlaying ? 'PAUSE' : 'PLAY'}
            labelText
          />
          <View style={styles.rightPills}>
            <PillButton onPress={playPrevious} icon="play-skip-back" />
            <PillButton onPress={playNext} icon="play-skip-forward" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/** زر بيضاوي داكن مع تسمية صغيرة أسفله */
function PillButton({
  onPress,
  icon,
  label,
  labelText,
}: {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  labelText?: boolean;
}) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const INK_SOFT = c.textSecondary;
  const styles = React.useMemo(() => makeStyles(c), [isDark]);
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.pill}
        hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
      >
        <View style={styles.pillGloss} />
      </TouchableOpacity>
      {labelText ? (
        <Text style={[styles.pillLabel, { color: INK_SOFT }]}>{label}</Text>
      ) : (
        <Ionicons name={icon!} size={11} color={INK_SOFT} style={{ marginTop: 6 }} />
      )}
    </View>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  iconBtn: {
    padding: 6,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: TITLE_SIZE,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: SUBTITLE_SIZE,
    fontWeight: '500',
    marginTop: 3,
  },
  miniIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 12,
    paddingBottom: 2,
  },
  repeatBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    fontSize: 8,
    fontWeight: '800',
    color: c.primary,
  },
  barHit: {
    height: 22,
    justifyContent: 'center',
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    fontSize: 9,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  rightPills: {
    flexDirection: 'row',
    gap: 16,
  },
  pill: {
    width: 58,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.primary,
    overflow: 'hidden',
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  pillGloss: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pillLabel: {
    marginTop: 6,
    fontSize: LABEL_SIZE,
    fontWeight: '700',
    letterSpacing: 1,
  },
});