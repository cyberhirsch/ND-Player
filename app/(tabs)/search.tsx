import {
    View, Text, TextInput, ScrollView, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { search, getAlbum, getPlaylists, getPlaylist, getCoverArtUrl, getStarred } from '../../src/api/navidrome';
import { usePlayerStore, useOfflineStore, useLibraryStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';

const CARD_GAP = theme.spacing.sm;
const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - theme.spacing.md * 2 - CARD_GAP) / 2;

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [songs, setSongs] = useState<any[]>([]);
    const [starredAlbumIds, setStarredAlbumIds] = useState<Set<string>>(new Set());
    const [starredSongs, setStarredSongs] = useState<any[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(true);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setQueue = usePlayerStore((state) => state.setQueue);
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const albumCache = useLibraryStore((state) => state.albumCache);

    // Load playlists once on mount
    useEffect(() => {
        if (!isOfflineMode) loadPlaylists();
    }, [isOfflineMode]);

    // Debounced server song search (only when not in favorites mode)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim() || favoritesOnly) { setSongs([]); return; }
        debounceRef.current = setTimeout(() => searchSongs(query.trim()), 500);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, favoritesOnly]);

    // Fetch starred items when heart is toggled on
    useEffect(() => {
        if (favoritesOnly && !isOfflineMode) {
            loadFavorites();
        } else {
            setStarredAlbumIds(new Set());
            setStarredSongs([]);
        }
    }, [favoritesOnly, isOfflineMode]);

    const loadPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            setPlaylists(await getPlaylists());
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const searchSongs = async (q: string) => {
        setLoadingSongs(true);
        try {
            const results = await search(q);
            setSongs(results.songs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSongs(false);
        }
    };

    const loadFavorites = async () => {
        setLoadingFavorites(true);
        try {
            const starred = await getStarred();
            setStarredAlbumIds(new Set(starred.albums.map((a: any) => a.id)));
            setStarredSongs(starred.songs);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not load favorites.');
        } finally {
            setLoadingFavorites(false);
        }
    };

    const playSong = useCallback((song: any) => {
        setQueue([{
            id: song.id, title: song.title, artist: song.artist,
            album: song.album, coverArt: song.coverArt, duration: song.duration,
        }], 0);
    }, [setQueue]);

    const playAlbum = useCallback(async (albumId: string) => {
        try {
            const album = await getAlbum(albumId);
            if (album?.song?.length > 0) {
                setQueue(album.song.map((s: any) => ({
                    id: s.id, title: s.title, artist: s.artist,
                    album: s.album, coverArt: s.coverArt, duration: s.duration,
                })), 0);
            }
        } catch (e) { Alert.alert('Playback Error', 'Could not load album.'); }
    }, [setQueue]);

    const playPlaylist = useCallback(async (playlistId: string) => {
        try {
            const playlist = await getPlaylist(playlistId);
            if (playlist?.entry?.length > 0) {
                setQueue(playlist.entry.map((s: any) => ({
                    id: s.id, title: s.title, artist: s.artist,
                    album: s.album, coverArt: s.coverArt, duration: s.duration,
                })), 0);
            }
        } catch (e) { Alert.alert('Playback Error', 'Could not load playlist.'); }
    }, [setQueue]);

    // ── Compute filtered sections ────────────────────────────────────────────
    const q = query.trim().toLowerCase();
    const allAlbums: any[] = albumCache?.data ?? [];

    const filteredPlaylists = favoritesOnly
        ? [] // playlists are not starrable in Subsonic
        : q ? playlists.filter(p => p.name?.toLowerCase().includes(q)) : playlists;

    const filteredAlbums = favoritesOnly
        ? allAlbums.filter(a => starredAlbumIds.has(a.id) &&
            (!q || a.title?.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q)))
        : q
            ? allAlbums.filter(a => a.title?.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q))
            : allAlbums;

    const displayedSongs = favoritesOnly
        ? starredSongs.filter(s => !q || s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q))
        : songs;

    const showSongsSection = favoritesOnly || !!q;
    const isInitialLoading = loadingPlaylists || loadingFavorites;
    const isEmpty = filteredPlaylists.length === 0 && filteredAlbums.length === 0 &&
        displayedSongs.length === 0 && !loadingSongs;

    // ── Offline guard ────────────────────────────────────────────────────────
    if (isOfflineMode) {
        return (
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <View style={[styles.searchBox, { flex: 1 }]}>
                        <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
                        <Text style={[styles.input, { color: theme.colors.textSecondary }]}>Filter…</Text>
                    </View>
                </View>
                <View style={styles.center}>
                    <Ionicons name="cloud-offline" size={48} color={theme.colors.border} />
                    <Text style={styles.hint}>Not available in offline mode</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* ── Top bar: search + heart ── */}
            <View style={styles.topBar}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Filter playlists, albums, songs…"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={() => setFavoritesOnly(f => !f)} style={styles.heartBtn}>
                    <Ionicons
                        name={favoritesOnly ? 'heart' : 'heart-outline'}
                        size={26}
                        color={favoritesOnly ? theme.colors.error : theme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* ── Body ── */}
            {isInitialLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* ── Playlists ── */}
                    {filteredPlaylists.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Playlists</Text>
                            {filteredPlaylists.map(p => (
                                <PlaylistRow key={p.id} item={p} onPlay={playPlaylist} />
                            ))}
                        </View>
                    )}

                    {/* ── Albums ── */}
                    {filteredAlbums.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Albums</Text>
                            <View style={styles.albumGrid}>
                                {filteredAlbums.map(a => (
                                    <AlbumCard key={a.id} item={a} onPlay={playAlbum} />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Songs ── */}
                    {showSongsSection && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Songs</Text>
                            {loadingSongs ? (
                                <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginTop: 8 }} />
                            ) : displayedSongs.length > 0 ? (
                                displayedSongs.map(s => (
                                    <SongRow key={s.id} item={s} onPlay={playSong} />
                                ))
                            ) : (
                                <Text style={styles.empty}>
                                    {favoritesOnly ? 'No starred songs' : `No songs found for "${query}"`}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* ── Empty state ── */}
                    {isEmpty && !isInitialLoading && (
                        <View style={styles.center}>
                            {favoritesOnly ? (
                                <>
                                    <Ionicons name="heart-outline" size={48} color={theme.colors.border} />
                                    <Text style={styles.hint}>No favorites yet</Text>
                                    <Text style={styles.subHint}>Star albums or songs in Navidrome to see them here</Text>
                                </>
                            ) : q ? (
                                <>
                                    <Ionicons name="search" size={48} color={theme.colors.border} />
                                    <Text style={styles.hint}>No results for "{query}"</Text>
                                </>
                            ) : null}
                        </View>
                    )}

                </ScrollView>
            )}
        </View>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const PlaylistRow = memo(({ item, onPlay }: { item: any; onPlay: (id: string) => void }) => (
    <TouchableOpacity style={styles.row} onPress={() => onPlay(item.id)}>
        <View style={styles.rowIcon}>
            <Ionicons name="musical-notes" size={20} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.rowInfo}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.rowSub} numberOfLines={1}>
                {item.songCount} songs{item.duration ? ` · ${Math.round(item.duration / 60)} min` : ''}
            </Text>
        </View>
        <Ionicons name="play-circle-outline" size={26} color={theme.colors.accent} />
    </TouchableOpacity>
));

const AlbumCard = memo(({ item, onPlay }: { item: any; onPlay: (id: string) => void }) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    useEffect(() => { getCoverArtUrl(item.coverArt).then(setCoverUrl).catch(() => {}); }, [item.coverArt]);
    return (
        <TouchableOpacity style={styles.albumCard} onPress={() => onPlay(item.id)}>
            <View style={styles.albumCover}>
                {coverUrl
                    ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Ionicons name="musical-notes" size={28} color={theme.colors.border} />
                }
            </View>
            <Text style={styles.albumTitle} numberOfLines={1}>{item.title || item.name}</Text>
            <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
        </TouchableOpacity>
    );
});

const SongRow = memo(({ item, onPlay }: { item: any; onPlay: (item: any) => void }) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    useEffect(() => { getCoverArtUrl(item.coverArt).then(setCoverUrl).catch(() => {}); }, [item.coverArt]);
    return (
        <TouchableOpacity style={styles.row} onPress={() => onPlay(item)}>
            <View style={styles.thumb}>
                {coverUrl
                    ? <Image source={{ uri: coverUrl }} style={styles.thumbImage} />
                    : <Ionicons name="musical-notes" size={18} color={theme.colors.border} />
                }
            </View>
            <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.artist} · {item.album}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={26} color={theme.colors.accent} />
        </TouchableOpacity>
    );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 10,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
    },
    clearBtn: {
        marginLeft: theme.spacing.xs,
    },
    heartBtn: {
        padding: theme.spacing.xs,
    },
    scroll: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: theme.spacing.xl,
    },
    hint: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        textAlign: 'center',
    },
    subHint: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    sectionHeader: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    // Playlist row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    rowInfo: {
        flex: 1,
        gap: 3,
    },
    rowTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    },
    rowSub: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    // Album grid
    albumGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
    },
    albumCard: {
        width: cardWidth,
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
        fontWeight: 'bold',
    },
    albumArtist: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    // Song row thumb
    thumb: {
        width: 40,
        height: 40,
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
    empty: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        marginTop: theme.spacing.sm,
    },
});
