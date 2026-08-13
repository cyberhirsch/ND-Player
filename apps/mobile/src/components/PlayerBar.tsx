import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Music, SkipBack, Pause, Play, SkipForward, Repeat, Repeat1 } from 'lucide-react-native';
import { usePlayerStore, useOfflineStore, RepeatMode } from '../store/useStore';
import { useState, useEffect } from 'react';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { getCoverArtUrl } from '../api/navidrome';
import { theme } from '../constants/theme';
import TrackListModal from './TrackListModal';

export default function PlayerBar() {
    const { currentTrack, repeatMode, cycleRepeat, playNext, playPrev } = usePlayerStore();
    const playbackState = usePlaybackState();
    const isPlaying = playbackState.state === State.Playing;
    const isLoading = playbackState.state === State.Loading || playbackState.state === State.Buffering;
    const repeatColor = repeatMode === 'off' ? theme.colors.textSecondary : theme.colors.accent;
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [showQueue, setShowQueue] = useState(false);

    useEffect(() => {
        if (!currentTrack) return;
        setCoverUrl(null);
        if (currentTrack.localCoverUri) {
            setCoverUrl(currentTrack.localCoverUri);
        } else if (currentTrack.coverArt) {
            getCoverArtUrl(currentTrack.coverArt).then(setCoverUrl).catch(() => {});
        }
    }, [currentTrack]);

    const togglePlayPause = async () => {
        if (isPlaying) await TrackPlayer.pause();
        else await TrackPlayer.play();
    };

    if (!currentTrack) return null;

    return (
        <>
            <TrackListModal
                visible={showQueue}
                onClose={() => setShowQueue(false)}
                coverUrl={coverUrl}
            />
            <View style={styles.container}>
                <View style={styles.leftContainer}>
                    <TouchableOpacity onPress={() => setShowQueue(true)} activeOpacity={0.8}>
                        {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={styles.cover} onError={() => setCoverUrl(null)} />
                        ) : (
                            <View style={[styles.cover, styles.coverFallback]}>
                                <Music size={28} color={theme.colors.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.info} onPress={() => setShowQueue(true)} activeOpacity={0.7}>
                        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
                        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={() => playPrev()}>
                        <SkipBack size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={togglePlayPause} disabled={isLoading}>
                        {isLoading
                            ? <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                            : isPlaying
                                ? <Pause size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                                : <Play size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                        }
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => playNext()}>
                        <SkipForward size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => cycleRepeat()} style={styles.repeatBtn}>
                    {repeatMode === 'one'
                        ? <Repeat1 size={24} color={repeatColor} />
                        : <Repeat size={24} color={repeatColor} />
                    }
                </TouchableOpacity>
            </View>
        </>
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
    coverFallback: {
        justifyContent: 'center',
        alignItems: 'center',
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
    repeatBtn: {
        marginLeft: 15,
        padding: 5,
    },
});
