import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore, useOfflineStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { getStreamUrl, getCoverArtUrl } from '../api/navidrome';
import { downloadTrack, deleteTrack } from '../utils/downloader';
import { theme } from '../constants/theme';

export default function PlayerBar() {
    const { currentTrack, isPlaying, setPlaying, playNext, playPrev } = usePlayerStore();
    const { downloadedTracks, addDownloadedTrack, removeDownloadedTrack } = useOfflineStore();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentTrack) {
            loadSound();
            loadCover();
        }
    }, [currentTrack]);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const loadCover = async () => {
        if (currentTrack) {
            const url = await getCoverArtUrl(currentTrack.coverArt);
            setCoverUrl(url);
        }
    };

    const loadSound = async () => {
        if (sound) {
            await sound.unloadAsync();
        }
        if (!currentTrack) return;

        try {
            let uri = downloadedTracks[currentTrack.id];
            if (!uri) {
                uri = await getStreamUrl(currentTrack.id);
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: isPlaying }
            );
            setSound(newSound);
            setPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    if (status.didJustFinish) {
                        playNext();
                    }
                }
            });

        } catch (e) {
            console.error('Failed to load sound', e);
        }
    };

    const togglePlayPause = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
            setPlaying(false);
        } else {
            await sound.playAsync();
            setPlaying(true);
        }
    };

    const handleDownload = async () => {
        if (!currentTrack) return;
        if (downloadedTracks[currentTrack.id]) {
            await deleteTrack(currentTrack.id);
        } else {
            setDownloading(true);
            await downloadTrack(currentTrack.id);
            setDownloading(false);
        }
    };

    if (!currentTrack) return null;

    const isDownloaded = !!downloadedTracks[currentTrack.id];

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {coverUrl && (
                    <Image source={{ uri: coverUrl }} style={styles.cover} />
                )}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={playPrev}>
                    <Ionicons name="play-skip-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={theme.colors.background} />
                </TouchableOpacity>
                <TouchableOpacity onPress={playNext}>
                    <Ionicons name="play-skip-forward" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleDownload} disabled={downloading} style={styles.downloadBtn}>
                <Ionicons
                    name={isDownloaded ? "cloud-done" : "cloud-download-outline"}
                    size={24}
                    color={isDownloaded ? theme.colors.accent : theme.colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 90,
        backgroundColor: theme.colors.player,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    cover: {
        width: 56,
        height: 56,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
    },
    info: {
        marginLeft: 10,
        flex: 1,
    },
    title: {
        color: theme.colors.textPrimary,
        fontWeight: '500',
        fontSize: 14,
    },
    artist: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    playButton: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadBtn: {
        marginLeft: 15,
        padding: 5,
    }
});
