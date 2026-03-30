import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, TextInput, Image,
} from 'react-native';
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Search, XCircle, Heart, Music2, Play } from 'lucide-react-native';
import { getSongs, getStarred, search, getCoverArtUrl } from '../../src/api/navidrome';
import { usePlayerStore, useOfflineStore, useAuthStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';
import NoServer from '../../src/components/NoServer';

const PAGE_SIZE = 50;

export default function SongsScreen() {
    const [allSongs, setAllSongs] = useState<any[]>([]);
    const [starredSongs, setStarredSongs] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searching, setSearching] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [filter, setFilter] = useState('');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const fetchingRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const serverUrl = useAuthStore((state) => state.serverUrl);
    const setQueue = usePlayerStore((state) => state.setQueue);
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);

    useEffect(() => {
        if (!isOfflineMode) {
            loadInitial();
        } else {
            setLoading(false);
        }
    }, [isOfflineMode]);

    // Re-fetch starred songs when heart is pressed, in case the initial mount fetch failed
    useEffect(() => {
        if (favoritesOnly && !isOfflineMode) {
            getStarred()
                .then(r => setStarredSongs(r.songs ?? []))
                .catch(e => console.error('Failed to load starred songs:', e));
        }
    }, [favoritesOnly, isOfflineMode]);

    // Debounced search API when filter changes (only in non-favorites mode)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = filter.trim();
        if (!q || favoritesOnly) { setSearchResults([]); return; }
        debounceRef.current = setTimeout(() => runSearch(q), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [filter, favoritesOnly]);

    const loadInitial = async () => {
        setLoading(true);
        // Load both independently so one failure doesn't block the other
        const [songsResult, starredResult] = await Promise.allSettled([
            getSongs(0, PAGE_SIZE),
            getStarred(),
        ]);
        if (songsResult.status === 'fulfilled') {
            const songs = songsResult.value;
            setAllSongs(songs);
            setHasMore(songs.length === PAGE_SIZE);
        } else {
            console.error('Failed to load songs:', songsResult.reason);
        }
        if (starredResult.status === 'fulfilled') {
            setStarredSongs(starredResult.value.songs ?? []);
        } else {
            console.error('Failed to load starred songs:', starredResult.reason);
        }
        setLoading(false);
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore || fetchingRef.current || favoritesOnly || filter.trim()) return;
        fetchingRef.current = true;
        setLoadingMore(true);
        try {
            const data = await getSongs(allSongs.length, PAGE_SIZE);
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setAllSongs(prev => [...prev, ...data]);
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    };

    const runSearch = async (q: string) => {
        setSearching(true);
        try {
            const results = await search(q, 0, 50);
            setSearchResults(results.songs ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const playSong = useCallback((song: any, list: any[]) => {
        const idx = list.findIndex(s => s.id === song.id);
        const tracks = list.map(s => ({
            id: s.id, title: s.title, artist: s.artist,
            album: s.album, coverArt: s.coverArt, duration: s.duration,
        }));
        setQueue(tracks, idx >= 0 ? idx : 0);
    }, [setQueue]);

    const q = filter.trim().toLowerCase();

    // Determine which list to display
    const displayedSongs = (() => {
        if (favoritesOnly) {
            return q
                ? starredSongs.filter(s => s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q))
                : starredSongs;
        }
        return q ? searchResults : allSongs;
    })();

    const isSearching = !favoritesOnly && !!q;

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
            {/* Filter bar */}
            <View style={styles.filterRow}>
                <View style={styles.filterBar}>
                    <Search size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.filterInput}
                        placeholder={favoritesOnly ? 'Filter starred songs…' : 'Search songs…'}
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
                <TouchableOpacity onPress={() => setFavoritesOnly(f => !f)} style={styles.heartBtn}>
                    {favoritesOnly
                        ? <Heart size={24} color={theme.colors.accent} fill={theme.colors.accent} />
                        : <Heart size={24} color={theme.colors.textSecondary} />
                    }
                </TouchableOpacity>
            </View>

            {searching ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={displayedSongs}
                    keyExtractor={(item, i) => item.id ?? String(i)}
                    contentContainerStyle={styles.list}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    renderItem={({ item }) => (
                        <SongRow item={item} onPress={() => playSong(item, displayedSongs)} />
                    )}
                    ListFooterComponent={
                        loadingMore
                            ? <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginVertical: theme.spacing.md }} />
                            : null
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            {favoritesOnly ? (
                                <>
                                    <Heart size={48} color={theme.colors.border} />
                                    <Text style={styles.emptyText}>No starred songs</Text>
                                    <Text style={styles.emptyHint}>Star songs in Navidrome to see them here</Text>
                                </>
                            ) : isSearching ? (
                                <Text style={styles.emptyText}>No songs found for "{filter.trim()}"</Text>
                            ) : isOfflineMode ? (
                                <Text style={styles.emptyText}>Not available in offline mode</Text>
                            ) : (
                                <Text style={styles.emptyText}>No songs found</Text>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
}

const SongRow = memo(({ item, onPress }: { item: any; onPress: () => void }) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        if (item.coverArt) {
            getCoverArtUrl(item.coverArt).then(setCoverUrl).catch(() => {});
        }
    }, [item.coverArt]);

    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.thumb}>
                {coverUrl
                    ? <Image source={{ uri: coverUrl }} style={styles.thumbImage} />
                    : <Music2 size={18} color={theme.colors.border} />
                }
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.artist}{item.album ? ` · ${item.album}` : ''}</Text>
            </View>
            <Play size={26} color={theme.colors.accent} />
        </TouchableOpacity>
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
    thumb: {
        width: 44,
        height: 44,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        overflow: 'hidden',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
        gap: 3,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    },
    sub: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingTop: 80,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        textAlign: 'center',
    },
    emptyHint: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: theme.spacing.lg,
    },
});
