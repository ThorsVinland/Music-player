import { StatusBar, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import StaticGradientBackground from '@/components/ui/StaticGradientBackground';
import MusicList from '@/components/music/MusicList';
import MiniPlayer from '@/components/music/MiniPlayer';
import { Audio } from 'expo-av';

export default function Home() {

    const [currentSong, setCurrentSong] = useState<string | null>(null);
    const [currentUri, setCurrentUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const [artwork, setArtwork] = useState<string | undefined>(undefined);

    const handlePlay = async (songName: string, uri: string, art?: string) => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );
            soundRef.current = sound;
            setCurrentSong(songName);
            setCurrentUri(uri);
            setArtwork(art);
            setIsPlaying(true);

        } catch (error) {
            console.log("Error playing:", error);
        }
    };

    const togglePlay = async () => {

        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();

        if (!status.isLoaded) {
            console.warn("الصوت غير محمّل بعد");
            return;
        }
        if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
        } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
        }

    };

    return (
        <View style={styles.container}>
            <StatusBar
                hidden
            />
            <StaticGradientBackground />
            <View style={styles.header}></View>
            <MusicList onPlay={handlePlay} />
            <MiniPlayer
                currentSong={currentSong}
                artwork={artwork}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
            />
        </View>
    )
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
})