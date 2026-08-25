import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { usePlayerStore } from '@/store/playerStore';

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentUri: string | null = null;
  private isInitialized = false;
  private isSeeking = false;

  async init() {
    if (this.isInitialized) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (e) {
      console.log('Audio init error:', e);
    }
  }

  private onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    const { setPosition, setDuration, setIsPlaying } = usePlayerStore.getState();

    // Only update position from audio if the user is not actively seeking
    if (!this.isSeeking) {
      setPosition(status.positionMillis || 0);
    }
    setDuration(status.durationMillis || 0);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      const { repeatMode, playNext } = usePlayerStore.getState();
      if (repeatMode === 'one') {
        this.sound?.replayAsync();
      } else if (repeatMode === 'all') {
        playNext();
      } else {
        const { currentIndex, playlist } = usePlayerStore.getState();
        if (currentIndex < playlist.length - 1) {
          playNext();
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  async playUri(uri: string) {
    await this.init();

    try {
      if (this.sound) {
        try {
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        } catch (e) {
          // ignore cleanup error
        }
        this.sound = null;
      }

      this.currentUri = uri;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 250 },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      usePlayerStore.getState().setIsPlaying(true);
    } catch (error) {
      console.log('Error playing audio URI:', error);
    }
  }

  async togglePlay() {
    if (!this.sound) {
      const { currentUri } = usePlayerStore.getState();
      if (currentUri) {
        await this.playUri(currentUri);
      }
      return;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.sound.pauseAsync();
          usePlayerStore.getState().setIsPlaying(false);
        } else {
          await this.sound.playAsync();
          usePlayerStore.getState().setIsPlaying(true);
        }
      }
    } catch (e) {
      console.log('togglePlay error:', e);
    }
  }

  setSeeking(seeking: boolean) {
    this.isSeeking = seeking;
  }

  async seekTo(positionMillis: number) {
    if (!this.sound) return;
    try {
      this.isSeeking = true;
      usePlayerStore.getState().setPosition(positionMillis);
      await this.sound.setPositionAsync(positionMillis);
    } catch (e) {
      console.log('seekTo error:', e);
    } finally {
      // Small timeout to let Expo AV catch up before accepting position status updates again
      setTimeout(() => {
        this.isSeeking = false;
      }, 300);
    }
  }
}

export const audioService = new AudioService();
