import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { getPlaylists, getPlaylist } from '../../src/api/navidrome';
import { usePlayerStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PlaylistsScreen() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const setQueue = usePlayerStore((state) => state.setQueue);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        try {
            const data = await getPlaylists();
            setPlaylists(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const playPlaylist = async (playlistId: string) => {
        try {
            const playlist = await getPlaylist(playlistId);
            if (playlist && playlist.entry && playlist.entry.length > 0) {
                const tracks = playlist.entry.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    artist: s.artist,
                    album: s.album,
                    coverArt: s.coverArt,
                    duration: s.duration
                }));
                setQueue(tracks, 0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.item} onPress={() => playPlaylist(item.id)}>
            <View style={styles.iconContainer}>
                <Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.songCount} songs • {item.duration ? Math.round(item.duration / 60) : 0} min</Text>
            </View>
            <Ionicons name="play-circle-outline" size={24} color={theme.colors.accent} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={playlists}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    list: {
        padding: theme.spacing.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        padding: theme.spacing.md,
        borderRadius: 8,
        marginBottom: theme.spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: theme.colors.background,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    info: {
        flex: 1,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: '500',
        marginBottom: 4,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
});
