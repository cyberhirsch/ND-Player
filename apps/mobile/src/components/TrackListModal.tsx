import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Animated, PanResponder } from 'react-native';
import { useRef, useEffect, memo } from 'react';
import { X, Music, Play } from 'lucide-react-native';
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
    const translateY = useRef(new Animated.Value(0)).current;
    const atTopRef = useRef(true);

    useEffect(() => {
        if (visible) {
            translateY.setValue(0);
            atTopRef.current = true;
            setTimeout(() => {
                listRef.current?.scrollToIndex({
                    index: currentIndex >= 0 ? currentIndex : 0,
                    animated: true,
                    viewPosition: 0.3,
                });
            }, 150);
        }
    }, [visible, currentIndex]);

    const dismiss = () => {
        Animated.timing(translateY, { toValue: 800, duration: 200, useNativeDriver: true }).start(onClose);
    };

    const snapBack = () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    };

    // Pan responder for the drag handle only
    const handlePan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) translateY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 100 || g.vy > 0.8) dismiss();
                else snapBack();
            },
        })
    ).current;

    // Pan responder for the list — only activates when list is scrolled to top and pulling down
    const listPan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => atTopRef.current && g.dy > 15 && g.dy > Math.abs(g.dx),
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) translateY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 100 || g.vy > 0.8) dismiss();
                else snapBack();
            },
        })
    ).current;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
            <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>

                {/* Drag handle */}
                <View style={styles.header} {...handlePan.panHandlers}>
                    <View style={styles.handle} />
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>Queue</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={26} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Now Playing hero */}
                {currentTrack && (
                    <View style={styles.hero}>
                        <View style={styles.heroCover}>
                            {coverUrl
                                ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                : <Music size={36} color={theme.colors.textSecondary} />
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
                <View style={styles.listWrapper} {...listPan.panHandlers}>
                    <FlatList
                        ref={listRef}
                        data={queue}
                        keyExtractor={(_, i) => String(i)}
                        contentContainerStyle={styles.list}
                        onScrollToIndexFailed={() => {}}
                        scrollEventThrottle={16}
                        onScroll={(e) => {
                            atTopRef.current = e.nativeEvent.contentOffset.y <= 0;
                        }}
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
            </Animated.View>
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
                ? <Music size={16} color={theme.colors.accent} style={styles.rowIcon} />
                : <View style={styles.rowIconPlaceholder} />
            }
            <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, isCurrent && styles.rowTitleActive]} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={styles.rowArtist} numberOfLines={1}>{artist}</Text>
            </View>
        </View>
        {!isCurrent && (
            <Play size={18} color={theme.colors.textSecondary} />
        )}
    </TouchableOpacity>
));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        marginTop: 40,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
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
    listWrapper: {
        flex: 1,
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
