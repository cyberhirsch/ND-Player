import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { getAlbums, getAlbum, getCoverArtUrl } from '../../src/api/navidrome';
import { usePlayerStore } from '../../src/store/useStore';
import { theme } from '../../src/constants/theme';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - (theme.spacing.md * 3)) / numColumns;

export default function AlbumsScreen() {
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const setQueue = usePlayerStore((state) => state.setQueue);

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        try {
            const data = await getAlbums();
            setAlbums(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const playAlbum = async (albumId: string) => {
        try {
            const album = await getAlbum(albumId);
            if (album && album.song && album.song.length > 0) {
                const tracks = album.song.map((s: any) => ({
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
        <TouchableOpacity style={styles.card} onPress={() => playAlbum(item.id)}>
            <AlbumCover id={item.coverArt} />
            <View style={styles.cardInfo}>
                <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
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
                data={albums}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.columnWrapper}
            />
        </View>
    );
}

const AlbumCover = ({ id }: { id: string }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        getCoverArtUrl(id).then(setUrl);
    }, [id]);

    if (!url) return <View style={[styles.cover, styles.placeholder]} />;

    return <Image source={{ uri: url }} style={styles.cover} />;
};

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
});
