import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert, TextInput } from 'react-native';
import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { getAlbums, getAlbum, getCoverArtUrl, getStarred } from '../../src/api/navidrome';
import { usePlayerStore, useOfflineStore, useLibraryStore, isAlbumCacheFresh } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { downloadAlbum, deleteAlbum } from '../../src/utils/downloader';

const PAGE_SIZE = 50;
const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - (theme.spacing.md * 3)) / numColumns;

export default function AlbumsScreen() {
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [downloadingAlbums, setDownloadingAlbums] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState('');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [starredAlbums, setStarredAlbums] = useState<any[]>([]);
    const [loadingStarred, setLoadingStarred] = useState(false);
    const [bgLoading, setBgLoading] = useState(false);
    const fetchingRef = useRef(false);
    const bgFetchingRef = useRef(false);

    const setQueue = usePlayerStore((state) => state.setQueue);
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const downloadedAlbums = useOfflineStore((state) => state.downloadedAlbums);
    const isAlbumDownloaded = useOfflineStore((state) => state.isAlbumDownloaded);
    const albumCache = useLibraryStore((state) => state.albumCache);
    const setAlbumCache = useLibraryStore((state) => state.setAlbumCache);
    const appendAlbumCache = useLibraryStore((state) => state.appendAlbumCache);
    const clearAlbumCache = useLibraryStore((state) => state.clearAlbumCache);

    useEffect(() => {
        loadAlbums();
    }, [isOfflineMode]);

    // Fetch starred albums whenever heart is toggled on — uses getStarred2 (same proven endpoint as songs)
    useEffect(() => {
        if (favoritesOnly && !isOfflineMode) {
            setLoadingStarred(true);
            getStarred()
                .then(r => setStarredAlbums(r.albums ?? []))
                .catch(e => console.error('Failed to load starred albums:', e))
                .finally(() => setLoadingStarred(false));
        }
    }, [favoritesOnly, isOfflineMode]);

    const loadAlbums = async () => {
        setLoading(true);
        try {
            if (isOfflineMode) {
                const downloaded = Object.values(downloadedAlbums);
                setAlbums(downloaded.map(d => ({
                    id: d.id, title: d.title, artist: d.artist, coverArt: d.coverArt
                })));
                setHasMore(false);
            } else if (isAlbumCacheFresh(albumCache)) {
                setAlbums(albumCache!.data);
                setHasMore(albumCache!.hasMore);
                // If cache is partial, continue fetching in background
                if (albumCache!.hasMore) loadAllInBackground(albumCache!.data, albumCache!.nextOffset ?? albumCache!.data.length);
            } else {
                const data = await getAlbums(0, PAGE_SIZE);
                const more = data.length === PAGE_SIZE;
                setAlbums(data);
                setHasMore(more);
                setAlbumCache({ data, timestamp: Date.now(), hasMore: more, nextOffset: data.length });
                // Immediately start fetching remaining pages silently
                if (more) loadAllInBackground(data, data.length);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load albums. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Silently fetch all remaining pages and append to state + cache
    const loadAllInBackground = async (initial: any[], startOffset: number) => {
        if (bgFetchingRef.current || isOfflineMode) return;
        bgFetchingRef.current = true;
        setBgLoading(true);
        let offset = startOffset;
        let accumulated = [...initial];
        try {
            while (true) {
                const data = await getAlbums(offset, PAGE_SIZE);
                if (data.length === 0) {
                    setHasMore(false);
                    appendAlbumCache([], false, offset);
                    break;
                }
                accumulated = [...accumulated, ...data];
                const more = data.length === PAGE_SIZE;
                setAlbums([...accumulated]);
                offset += data.length;
                appendAlbumCache(data, more, offset);
                if (!more) { setHasMore(false); break; }
            }
        } catch (e) {
            console.error('Background album load failed:', e);
        } finally {
            setBgLoading(false);
            bgFetchingRef.current = false;
        }
    };

    const loadMore = async () => {
        // Background loader handles all pages; this is a fallback for manual scroll
        if (!hasMore || loadingMore || fetchingRef.current || isOfflineMode || bgFetchingRef.current) return;
        fetchingRef.current = true;
        setLoadingMore(true);
        try {
            const offset = albumCache?.nextOffset ?? albums.length;
            const data = await getAlbums(offset, PAGE_SIZE);
            if (data.length === 0) {
                setHasMore(false);
                appendAlbumCache([], false, offset);
            } else {
                const more = data.length === PAGE_SIZE;
                setAlbums(prev => [...prev, ...data]);
                setHasMore(more);
                appendAlbumCache(data, more, offset + data.length);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        clearAlbumCache();
        bgFetchingRef.current = false; // allow restart
        try {
            const data = await getAlbums(0, PAGE_SIZE);
            const more = data.length === PAGE_SIZE;
            setAlbums(data);
            setHasMore(more);
            setAlbumCache({ data, timestamp: Date.now(), hasMore: more, nextOffset: data.length });
            if (more) loadAllInBackground(data, data.length);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to refresh albums.');
        } finally {
            setRefreshing(false);
        }
    };

    const playAlbum = async (albumId: string) => {
        try {
            const downloadedAlbum = downloadedAlbums[albumId];

            if (downloadedAlbum?.trackList && downloadedAlbum.trackList.length > 0) {
                // Play from downloaded files using stored metadata
                setQueue(downloadedAlbum.trackList, 0);
            } else {
                // Stream from server
                const album = await getAlbum(albumId);
                if (album && album.song && album.song.length > 0) {
                    const tracks = album.song.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        album: s.album,
                        coverArt: s.coverArt,
                        duration: s.duration,
                        ...(downloadedAlbum?.tracks[s.id] ? { path: downloadedAlbum.tracks[s.id] } : {})
                    }));
                    setQueue(tracks, 0);
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Playback Error', 'Could not play album. Please try again.');
        }
    };

    const handleDownload = async (albumId: string, albumTitle: string) => {
        if (downloadingAlbums[albumId]) return; // already in progress
        setDownloadingAlbums(prev => ({ ...prev, [albumId]: true }));

        const result = await downloadAlbum(albumId, (progress) => {
            console.log(`Downloading: ${progress.trackTitle} (${progress.current}/${progress.total})`);
        });

        setDownloadingAlbums(prev => ({ ...prev, [albumId]: false }));

        if (result) {
            Alert.alert('Download Complete', `${albumTitle} is now available offline`);
        } else {
            Alert.alert('Download Failed', 'Could not download album');
        }
    };

    const handleDelete = async (albumId: string, albumTitle: string) => {
        Alert.alert(
            'Delete Album',
            `Remove ${albumTitle} from offline storage?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAlbum(albumId);
                        loadAlbums(); // Refresh list
                    }
                }
            ]
        );
    };

    const renderItem = useCallback(({ item }: { item: any }) => {
        const isDownloaded = isAlbumDownloaded(item.id);
        const isDownloading = downloadingAlbums[item.id];

        return (
            <View style={styles.card}>
                <TouchableOpacity onPress={() => playAlbum(item.id)}>
                    <AlbumCover id={item.coverArt} isOffline={isOfflineMode} />
                    <View style={styles.cardInfo}>
                        <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                </TouchableOpacity>

                {!isOfflineMode && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => isDownloaded ? handleDelete(item.id, item.title) : handleDownload(item.id, item.title)}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color={theme.colors.accent} />
                        ) : (
                            <Ionicons
                                name={isDownloaded ? 'checkmark-circle' : 'download-outline'}
                                size={24}
                                color={isDownloaded ? theme.colors.accent : theme.colors.textSecondary}
                            />
                        )}
                    </TouchableOpacity>
                )}

                {isOfflineMode && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item.id, item.title)}
                    >
                        <Ionicons name="trash-outline" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [isOfflineMode, downloadingAlbums, isAlbumDownloaded, playAlbum, handleDownload, handleDelete]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    const q = filter.trim().toLowerCase();
    const displayedAlbums = (() => {
        const base = favoritesOnly ? starredAlbums : albums;
        const filtered = q ? base.filter(a => a.title?.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q)) : base;
        return [...filtered].sort((a, b) => {
            const byArtist = (a.artist ?? '').localeCompare(b.artist ?? '', undefined, { sensitivity: 'base' });
            return byArtist !== 0 ? byArtist : (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
        });
    })();

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <View style={styles.filterBar}>
                    <Ionicons name="search" size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.filterInput}
                        placeholder={favoritesOnly ? 'Filter starred albums…' : 'Search albums…'}
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
                <TouchableOpacity onPress={() => setFavoritesOnly(f => !f)} style={styles.heartBtn}>
                    <Ionicons
                        name={favoritesOnly ? 'heart' : 'heart-outline'}
                        size={24}
                        color={favoritesOnly ? theme.colors.error : theme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
            {(bgLoading || loadingStarred) && (
                <View style={styles.bgLoadingBar}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text style={styles.bgLoadingText}>
                        {loadingStarred ? 'Loading starred albums…' : 'Loading all albums…'}
                    </Text>
                </View>
            )}
            <FlatList
                data={displayedAlbums}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.columnWrapper}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                refreshing={refreshing}
                onRefresh={!isOfflineMode ? onRefresh : undefined}
                ListFooterComponent={
                    loadingMore
                        ? <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginVertical: theme.spacing.md }} />
                        : null
                }
            />
        </View>
    );
}

const AlbumCover = memo(({ id, isOffline }: { id: string; isOffline: boolean }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOffline) {
            // In offline mode, id is already the local URI
            setUrl(id);
        } else {
            getCoverArtUrl(id).then(setUrl);
        }
    }, [id, isOffline]);

    if (!url) return (
        <View style={[styles.cover, styles.placeholder]}>
            <Ionicons name="musical-notes" size={32} color={theme.colors.border} />
        </View>
    );

    return (
        <Image
            source={{ uri: url }}
            style={styles.cover}
            onError={() => setUrl(null)}
        />
    );
});

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
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: theme.spacing.md,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    filterBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 10,
        marginLeft: theme.spacing.md,
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
    heartBtn: {
        marginLeft: theme.spacing.sm,
        padding: theme.spacing.xs,
    },
    bgLoadingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    bgLoadingText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.xs ?? 11,
    },
    list: {
        padding: theme.spacing.md,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    card: {
        width: cardWidth,
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        padding: theme.spacing.sm,
    },
    cover: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 4,
        marginBottom: theme.spacing.sm,
    },
    placeholder: {
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        gap: 4,
    },
    albumTitle: {
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
        fontSize: theme.fontSize.md,
    },
    albumArtist: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    actionButton: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        padding: 4,
    },
});
