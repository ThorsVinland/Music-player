import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from "react-native";
import * as MediaLibrary from "expo-media-library";

export default function MusicList({ onPlay }: { onPlay: (songName: string, uri: string, artWork?: string) => void }) {
    const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSong, setCurrentSong] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                alert("يجب منح إذن الوصول إلى الملفات الصوتية!");
                return;
            }

            let allSongs: MediaLibrary.Asset[] = [];
            let hasNextPage = true;
            let after: string | undefined = undefined;

            while (hasNextPage) {
                const media = await MediaLibrary.getAssetsAsync({
                    mediaType: "audio",
                    first: 1000,
                    after,
                });

                allSongs = [...allSongs, ...media.assets];
                hasNextPage = media.hasNextPage;
                after = media.endCursor;
            }

            const sorted = allSongs.sort((a, b) =>
                a.filename.localeCompare(b.filename, 'ar', { sensitivity: 'base' })
            );

            setSongs(sorted);
            setLoading(false);

        })();
    }, []);

    const handleSelectSong = async (uri: string, filename: string, id: string) => {
        setCurrentSong(filename);

        const info = await MediaLibrary.getAssetInfoAsync(id);
        const artwork = undefined;

        onPlay(filename, uri, artwork);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ffffffff" />
                <Text style={{ color: "white", marginTop: 10 }}>جاري جلب الأغاني...</Text>
            </View>
        );
    }

    if (songs.length === 0) {
        return (
            <View style={styles.center}>
                <Text>لم يتم العثور على أغانٍ </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={songs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.songItem,
                            currentSong === item.filename && styles.activeSong,
                        ]}
                        onPress={() => handleSelectSong(item.uri, item.filename, item.id)}
                    >
                        <Image
                            source={
                                item?.uri?.endsWith(".mp3")
                                    ? require("@/assets/images/music.png")
                                    : { uri: item.uri }
                            }
                            style={styles.artwork}
                        />
                        <Text
                            style={styles.songTitle}
                            numberOfLines={1}
                        >
                            {currentSong === item.filename ? "▶ " : ""}{item.filename}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginVertical: 6,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 10,
    },
    songTitle: {
        color: 'white',
        marginLeft: 10,
        flexShrink: 1,
    },
    activeSong: {
        backgroundColor: "rgba(0,255,128,0.2)",
    },
    artwork: {
        width: 48,
        height: 48,
        borderRadius: 10,
    },
});