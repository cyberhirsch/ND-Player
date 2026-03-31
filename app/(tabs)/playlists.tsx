import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { getPlaylists, getPlaylist } from '../../src/api/navidrome';
import { usePlayerStore, useOfflineStore, useAuthStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import { Music2, CheckCircle2, Download, Trash2, Play, Search, XCircle } from 'lucide-react-native';
import { downloadPlaylist, deletePlaylist } from '../../src/utils/downloader';

export default function PlaylistsScreen() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingPlaylists, setDownloadingPlaylists] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState('');
    const serverUrl = useAuthStore((state) => state.serverUrl);
    const setQueue = usePlayerStore((state) => state.setQueue);
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const downloadedPlaylists = useOfflineStore((state) => state.downloadedPlaylists);
    const isPlaylistDownloaded = useOfflineStore((state) => state.isPlaylistDownloaded);

    useEffect(() => {
        loadPlaylists();
    }, [isOfflineMode]);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            if (isOfflineMode || !serverUrl) {
                // Show only downloaded playlists
                const downloaded = Object.values(downloadedPlaylists);
                setPlaylists(downloaded.map(d => ({
                    id: d.id,
                    name: d.name,
                    songCount: Object.keys(d.tracks).length
                })));
            } else {
                // Show all playlists from server
                const data = await getPlaylists();
                setPlaylists(data);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load playlists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const playPlaylist = async (playlistId: string) => {
        try {
            const downloadedPlaylist = downloadedPlaylists[playlistId];

            if (downloadedPlaylist?.trackList && downloadedPlaylist.trackList.length > 0) {
                // Play from downloaded files using stored metadata
                setQueue(downloadedPlaylist.trackList, 0);
            } else {
                // Stream from server
                const playlist = await getPlaylist(playlistId);
                if (playlist && playlist.entry && playlist.entry.length > 0) {
                    const tracks = playlist.entry.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        album: s.album,
                        coverArt: s.coverArt,
                        duration: s.duration,
                        ...(downloadedPlaylist?.tracks[s.id] ? { path: downloadedPlaylist.tracks[s.id] } : {})
                    }));
                    setQueue(tracks, 0);
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Playback Error', 'Could not play playlist. Please try again.');
        }
    };

    const handleDownload = async (playlistId: string, playlistName: string) => {
        if (downloadingPlaylists[playlistId]) return; // already in progress
        setDownloadingPlaylists(prev => ({ ...prev, [playlistId]: true }));

        const result = await downloadPlaylist(playlistId, (progress) => {
            console.log(`Downloading: ${progress.trackTitle} (${progress.current}/${progress.total})`);
        });

        setDownloadingPlaylists(prev => ({ ...prev, [playlistId]: false }));

        if (result) {
            Alert.alert('Download Complete', `${playlistName} is now available offline`);
        } else {
            Alert.alert('Download Failed', 'Could not download playlist');
        }
    };

    const handleDelete = async (playlistId: string, playlistName: string) => {
        Alert.alert(
            'Delete Playlist',
            `Remove ${playlistName} from offline storage?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deletePlaylist(playlistId);
                        loadPlaylists(); // Refresh list
                    }
                }
            ]
        );
    };

    const renderItem = useCallback(({ item }: { item: any }) => {
        const isDownloaded = isPlaylistDownloaded(item.id);
        const isDownloading = downloadingPlaylists[item.id];

        return (
            <TouchableOpacity style={styles.item} onPress={() => playPlaylist(item.id)}>
                <View style={styles.iconContainer}>
                    <Music2 size={24} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.subtitle}>
                        {item.songCount} songs{item.duration ? ` • ${Math.round(item.duration / 60)} min` : ''}
                    </Text>
                </View>

                {!isOfflineMode && serverUrl && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            isDownloaded ? handleDelete(item.id, item.name) : handleDownload(item.id, item.name);
                        }}
                        disabled={isDownloading}
                        style={{ marginRight: 8 }}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color={theme.colors.accent} />
                        ) : (
                            isDownloaded
                                ? <CheckCircle2 size={24} color={theme.colors.accent} />
                                : <Download size={24} color={theme.colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                )}

                {(isOfflineMode || !serverUrl) ? (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id, item.name);
                        }}
                        style={{ marginRight: 8 }}
                    >
                        <Trash2 size={24} color={theme.colors.accent} />
                    </TouchableOpacity>
                ) : (
                    <Play size={24} color={theme.colors.accent} />
                )}
            </TouchableOpacity>
        );
    }, [isOfflineMode, downloadingPlaylists, isPlaylistDownloaded, playPlaylist, handleDownload, handleDelete]);


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    const q = filter.trim().toLowerCase();
    const displayedPlaylists = q
        ? playlists.filter(p => p.name?.toLowerCase().includes(q))
        : playlists;

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                <Search size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.filterInput}
                    placeholder="Filter playlists…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={filter}
                    onChangeText={setFilter}
                    autoCorrect={false}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
                {filter.length > 0 && (
                    <TouchableOpacity onPress={() => setFilter('')}>
                        <XCircle size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={displayedPlaylists}
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
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 10,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flex: undefined,
    },
    filterInput: {
        flex: 1,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
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
