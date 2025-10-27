import { StatusBar, StyleSheet, View } from 'react-native';
import React, { useState, useRef } from 'react';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import MusicList from '@/components/music/MusicList';
import MiniPlayer from '@/components/music/MiniPlayer';
import { Audio } from 'expo-av';

export default function Home() {
    const [currentSong, setCurrentSong] = useState<string | null>(null);
    const [currentUri, setCurrentUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const soundRef = useRef<Audio.Sound | null>(null);

    const handlePlay = async (songName: string, uri: string) => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
            setCurrentSong(songName);
            setCurrentUri(uri);
            setIsPlaying(true);
        } catch (error) {
            console.log("Error playing:", error);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
        }
    };

    const togglePlay = async () => {
        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();

        if (status.isLoaded && status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
        } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <StaticGradientBackground />
            <View style={styles.header}></View>
            <MusicList onPlay={handlePlay} />
            <MiniPlayer
                currentSong={currentSong}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                position={position}
                duration={duration}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: 'white',
    },
});