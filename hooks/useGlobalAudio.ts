import { usePlayerStore } from '@/store/playerStore';

export function useGlobalAudio() {
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const seekTo = usePlayerStore((state) => state.seekTo);

  return {
    togglePlay,
    handleSeek: seekTo,
  };
}
