import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, TextInput, Modal, Image, ScrollView, Alert,
} from 'react-native';
import { useEffect, useState, useCallback, memo } from 'react';
import { Search, XCircle, User, ChevronRight, X, Play, Music2, Download, CheckCircle2, Trash2 } from 'lucide-react-native';
import { getArtists, getArtist, getAlbum, getCoverArtUrl } from '../../src/api/navidrome';
import { usePlayerStore, useAuthStore, useOfflineStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import NoServer from '../../src/components/NoServer';
import { downloadAlbum, deleteAlbum } from '../../src/utils/downloader';

export default function ArtistsScreen() {
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
    const serverUrl = useAuthStore((state) => state.serverUrl);

    useEffect(() => {
        getArtists()
            .then(data => setArtists(data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const q = filter.trim().toLowerCase();
    const displayed = q
        ? artists.filter(a => a.name?.toLowerCase().includes(q))
        : artists;

    if (!serverUrl) return <NoServer />;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                <Search size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.filterInput}
                    placeholder="Filter artists…"
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
                data={displayed}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <ArtistRow item={item} onPress={() => setSelectedArtist(item)} />
                )}
            />

            {selectedArtist && (
                <ArtistModal
                    artist={selectedArtist}
                    onClose={() => setSelectedArtist(null)}
                />
            )}
        </View>
    );
}

// ── Artist row ────────────────────────────────────────────────────────────────

const ArtistRow = memo(({ item, onPress }: { item: any; onPress: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.avatar}>
            <User size={22} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            {item.albumCount > 0 && (
                <Text style={styles.rowSub}>{item.albumCount} album{item.albumCount !== 1 ? 's' : ''}</Text>
            )}
        </View>
        <ChevronRight size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
));

// ── Artist albums modal ───────────────────────────────────────────────────────

function ArtistModal({ artist, onClose }: { artist: any; onClose: () => void }) {
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingAlbums, setDownloadingAlbums] = useState<Record<string, boolean>>({});
    const serverUrl = useAuthStore((state) => state.serverUrl);
    const setQueue = usePlayerStore(state => state.setQueue);
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const isAlbumDownloaded = useOfflineStore((state) => state.isAlbumDownloaded);

    useEffect(() => {
        getArtist(artist.id)
            .then(data => setAlbums(data?.album ?? []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [artist.id]);

    const playAlbum = useCallback(async (albumId: string) => {
        try {
            const album = await getAlbum(albumId);
            if (album?.song?.length > 0) {
                setQueue(album.song.map((s: any) => ({
                    id: s.id, title: s.title, artist: s.artist,
                    album: s.album, coverArt: s.coverArt, duration: s.duration,
                })), 0);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    }, [setQueue, onClose]);

    const playAll = useCallback(async () => {
        try {
            const allTracks: any[] = [];
            for (const album of albums) {
                const data = await getAlbum(album.id);
                if (data?.song) allTracks.push(...data.song.map((s: any) => ({
                    id: s.id, title: s.title, artist: s.artist,
                    album: s.album, coverArt: s.coverArt, duration: s.duration,
                })));
            }
            if (allTracks.length > 0) {
                setQueue(allTracks, 0);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    }, [albums, setQueue, onClose]);

    const handleDownload = useCallback(async (albumId: string, albumTitle: string) => {
        if (downloadingAlbums[albumId]) return;
        setDownloadingAlbums(prev => ({ ...prev, [albumId]: true }));
        const result = await downloadAlbum(albumId);
        setDownloadingAlbums(prev => ({ ...prev, [albumId]: false }));
        if (result) {
            Alert.alert('Download Complete', `${albumTitle} is now available offline`);
        } else {
            Alert.alert('Download Failed', 'Could not download album');
        }
    }, [downloadingAlbums]);

    const handleDelete = useCallback((albumId: string, albumTitle: string) => {
        Alert.alert('Delete Album', `Remove ${albumTitle} from offline storage?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteAlbum(albumId) },
        ]);
    }, []);

    return (
        <Modal visible animationType="slide" onRequestClose={onClose}>
            <View style={styles.modal}>

                {/* Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.handle} />
                    <View style={styles.modalTitleRow}>
                        <View style={styles.modalAvatar}>
                            <User size={28} color={theme.colors.textSecondary} />
                        </View>
                        <View style={styles.modalTitleInfo}>
                            <Text style={styles.modalArtistName} numberOfLines={1}>{artist.name}</Text>
                            <Text style={styles.modalSub}>{albums.length} album{albums.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={26} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {!loading && albums.length > 0 && (
                        <TouchableOpacity style={styles.playAllBtn} onPress={playAll}>
                            <Play size={16} color={theme.colors.background} fill={theme.colors.background} />
                            <Text style={styles.playAllText}>Play All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.divider} />

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.accent} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.albumGrid}>
                        {albums.map(album => (
                            <AlbumCard
                                key={album.id}
                                item={album}
                                onPlay={playAlbum}
                                isOfflineMode={isOfflineMode}
                                isDownloaded={isAlbumDownloaded(album.id)}
                                isDownloading={!!downloadingAlbums[album.id]}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

// ── Album card inside modal ───────────────────────────────────────────────────

const AlbumCard = memo(({ item, onPlay, isOfflineMode, isDownloaded, isDownloading, onDownload, onDelete }: {
    item: any;
    onPlay: (id: string) => void;
    isOfflineMode: boolean;
    isDownloaded: boolean;
    isDownloading: boolean;
    onDownload: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
}) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        if (item.coverArt) getCoverArtUrl(item.coverArt).then(setCoverUrl).catch(() => {});
    }, [item.coverArt]);

    return (
        <TouchableOpacity style={styles.albumCard} onPress={() => onPlay(item.id)} activeOpacity={0.75}>
            <View style={styles.albumCover}>
                {coverUrl
                    ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Music2 size={28} color={theme.colors.border} />
                }
                {/* Download button overlay */}
                {!isOfflineMode && (
                    <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            isDownloaded ? onDelete(item.id, item.name ?? item.title) : onDownload(item.id, item.name ?? item.title);
                        }}
                        disabled={isDownloading}
                    >
                        {isDownloading
                            ? <ActivityIndicator size="small" color={theme.colors.accent} />
                            : isDownloaded
                                ? <CheckCircle2 size={18} color={theme.colors.accent} />
                                : <Download size={18} color={theme.colors.textPrimary} />
                        }
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.albumTitle} numberOfLines={2}>{item.name ?? item.title}</Text>
            {item.year > 0 && <Text style={styles.albumYear}>{item.year}</Text>}
        </TouchableOpacity>
    );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const ALBUM_CARD_SIZE = 150;

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
    },
    filterInput: {
        flex: 1,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
    },
    list: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    rowInfo: {
        flex: 1,
        gap: 3,
    },
    rowName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    },
    rowSub: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    // Modal
    modal: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    modalAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitleInfo: {
        flex: 1,
        gap: 4,
    },
    modalArtistName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
    },
    modalSub: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    playAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.accent,
        borderRadius: 20,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
    },
    playAllText: {
        color: theme.colors.background,
        fontWeight: '600',
        fontSize: theme.fontSize.md,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: theme.spacing.md,
    },
    albumGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    albumCard: {
        width: ALBUM_CARD_SIZE,
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        padding: theme.spacing.sm,
    },
    albumCover: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadBtn: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        padding: 5,
    },
    albumTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
    },
    albumYear: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.xs ?? 11,
        marginTop: 2,
    },
});
