import { Alert } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { usePlayerStore } from '@/store/playerStore';

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentUri: string | null = null;
  private isInitialized = false;
  private isSeeking = false;
  private isLoading = false;

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

    // Sync actual playing state from engine
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

  private playId = 0;

  async playUri(uri: string) {
    if (this.isLoading && this.currentUri === uri) return;
    
    const currentPlayId = ++this.playId;
    this.currentUri = uri;
    this.isLoading = true;
    
    await this.init();

    try {
      if (this.sound) {
        const oldSound = this.sound;
        this.sound = null;
        try {
          await oldSound.stopAsync();
          await oldSound.unloadAsync();
        } catch (e) {
          // ignore cleanup error
        }
      }

      // If another song was requested while we were cleaning up, abort this one
      if (this.playId !== currentPlayId) {
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 350 },
        this.onPlaybackStatusUpdate
      );

      // Final check before assigning the sound
      if (this.playId !== currentPlayId) {
        sound.unloadAsync();
        return;
      }

      this.sound = sound;
      usePlayerStore.getState().setIsPlaying(true);
    } catch (error: any) {
      if (this.playId === currentPlayId) {
        console.log('Error playing audio URI:', error);
        Alert.alert('Playback Error', `Failed to play audio: ${error.message || 'Unknown error'}`);
        usePlayerStore.getState().setIsPlaying(false);
      }
    } finally {
      if (this.playId === currentPlayId) {
        this.isLoading = false;
      }
    }
  }

  async togglePlay() {
    const { isPlaying, currentUri, setIsPlaying } = usePlayerStore.getState();

    if (!this.sound) {
      if (currentUri) {
        await this.playUri(currentUri);
      }
      return;
    }

    // 0ms Optimistic UI update: immediate feedback
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    try {
      if (nextState) {
        await this.sound.playAsync();
      } else {
        await this.sound.pauseAsync();
      }
    } catch (e) {
      console.log('togglePlay error:', e);
      // Revert if native failed
      setIsPlaying(isPlaying);
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
      setTimeout(() => {
        this.isSeeking = false;
      }, 300);
    }
  }
}

export const audioService = new AudioService();
