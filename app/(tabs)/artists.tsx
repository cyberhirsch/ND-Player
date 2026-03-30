import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, TextInput, Modal, Image, ScrollView,
} from 'react-native';
import { useEffect, useState, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getArtists, getArtist, getAlbum, getCoverArtUrl } from '../../src/api/navidrome';
import { usePlayerStore, useAuthStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import NoServer from '../../src/components/NoServer';

export default function ArtistsScreen() {
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

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
                <Ionicons name="search" size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
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
                        <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
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
            <Ionicons name="person" size={22} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            {item.albumCount > 0 && (
                <Text style={styles.rowSub}>{item.albumCount} album{item.albumCount !== 1 ? 's' : ''}</Text>
            )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
));

// ── Artist albums modal ───────────────────────────────────────────────────────

function ArtistModal({ artist, onClose }: { artist: any; onClose: () => void }) {
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const serverUrl = useAuthStore((state) => state.serverUrl);
    const setQueue = usePlayerStore(state => state.setQueue);

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

    return (
        <Modal visible animationType="slide" onRequestClose={onClose}>
            <View style={styles.modal}>

                {/* Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.handle} />
                    <View style={styles.modalTitleRow}>
                        <View style={styles.modalAvatar}>
                            <Ionicons name="person" size={28} color={theme.colors.textSecondary} />
                        </View>
                        <View style={styles.modalTitleInfo}>
                            <Text style={styles.modalArtistName} numberOfLines={1}>{artist.name}</Text>
                            <Text style={styles.modalSub}>{albums.length} album{albums.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={26} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {!loading && albums.length > 0 && (
                        <TouchableOpacity style={styles.playAllBtn} onPress={playAll}>
                            <Ionicons name="play" size={16} color={theme.colors.background} />
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
                            <AlbumCard key={album.id} item={album} onPlay={playAlbum} />
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

// ── Album card inside modal ───────────────────────────────────────────────────

const AlbumCard = memo(({ item, onPlay }: { item: any; onPlay: (id: string) => void }) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        if (item.coverArt) getCoverArtUrl(item.coverArt).then(setCoverUrl).catch(() => {});
    }, [item.coverArt]);

    return (
        <TouchableOpacity style={styles.albumCard} onPress={() => onPlay(item.id)} activeOpacity={0.75}>
            <View style={styles.albumCover}>
                {coverUrl
                    ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Ionicons name="musical-notes" size={28} color={theme.colors.border} />
                }
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
