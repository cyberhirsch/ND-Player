import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRef, useEffect, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/useStore';
import { theme } from '../constants/theme';

interface Props {
    visible: boolean;
    onClose: () => void;
    coverUrl: string | null;
}

export default function TrackListModal({ visible, onClose, coverUrl }: Props) {
    const { queue, currentIndex, currentTrack, jumpTo } = usePlayerStore();
    const listRef = useRef<FlatList>(null);

    // Scroll to current track when modal opens
    useEffect(() => {
        if (visible && currentIndex >= 0) {
            setTimeout(() => {
                listRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0.3 });
            }, 150);
        }
    }, [visible, currentIndex]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>Queue</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={26} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Now Playing hero */}
                {currentTrack && (
                    <View style={styles.hero}>
                        <View style={styles.heroCover}>
                            {coverUrl
                                ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                : <Ionicons name="musical-note" size={36} color={theme.colors.textSecondary} />
                            }
                        </View>
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroTitle} numberOfLines={1}>{currentTrack.title}</Text>
                            <Text style={styles.heroArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                            <Text style={styles.heroAlbum} numberOfLines={1}>{currentTrack.album}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.divider} />

                {/* Track list */}
                <FlatList
                    ref={listRef}
                    data={queue}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={styles.list}
                    onScrollToIndexFailed={() => {}}
                    renderItem={({ item, index }) => {
                        const isCurrent = index === currentIndex;
                        return (
                            <TrackRow
                                title={item.title}
                                artist={item.artist}
                                isCurrent={isCurrent}
                                onPress={() => { jumpTo(index); onClose(); }}
                            />
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

const TrackRow = memo(({ title, artist, isCurrent, onPress }: {
    title: string; artist: string; isCurrent: boolean; onPress: () => void;
}) => (
    <TouchableOpacity
        style={[styles.row, isCurrent && styles.rowActive]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowLeft}>
            {isCurrent
                ? <Ionicons name="musical-note" size={16} color={theme.colors.accent} style={styles.rowIcon} />
                : <View style={styles.rowIconPlaceholder} />
            }
            <View style={styles.rowInfo}>
                <Text
                    style={[styles.rowTitle, isCurrent && styles.rowTitleActive]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text style={styles.rowArtist} numberOfLines={1}>{artist}</Text>
            </View>
        </View>
        {!isCurrent && (
            <Ionicons name="play-outline" size={18} color={theme.colors.textSecondary} />
        )}
    </TouchableOpacity>
));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xs,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
    },
    // Hero (now playing)
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
    },
    heroCover: {
        width: 72,
        height: 72,
        borderRadius: 6,
        backgroundColor: theme.colors.border,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroInfo: {
        flex: 1,
        gap: 3,
    },
    heroTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
    },
    heroArtist: {
        color: theme.colors.accent,
        fontSize: theme.fontSize.md,
    },
    heroAlbum: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    list: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 6,
        marginBottom: 2,
    },
    rowActive: {
        backgroundColor: theme.colors.player,
    },
    rowLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        width: 20,
        marginRight: theme.spacing.sm,
    },
    rowIconPlaceholder: {
        width: 20,
        marginRight: theme.spacing.sm,
    },
    rowInfo: {
        flex: 1,
        gap: 2,
    },
    rowTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
    },
    rowTitleActive: {
        color: theme.colors.accent,
        fontWeight: '600',
    },
    rowArtist: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
});
