import { useRef, useCallback, useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import type { Album } from '../types';
import ContentToolbar from './ContentToolbar';
import FilterModal, { type FilterState } from './FilterModal';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Albums() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentSort, setCurrentSort] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({});
    const { actions } = usePlayerStore();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery({
        queryKey: ['albums', currentSort, filters],
        queryFn: async ({ pageParam = 0 }) => {
            // Use regular album list (no server-side search)
            let type = currentSort;
            if (filters.starred === 'yes') type = 'starred';
            if (filters.recentlyPlayed) type = 'recent';

            return navidromeApi.getAlbumList(
                type,
                50,
                pageParam as number,
                filters.genre,
                filters.year
            );
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage && lastPage.length === 50 ? allPages.length * 50 : undefined;
        },
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const lastAlbumRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handlePlayAlbum = async (e: React.MouseEvent, albumId: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const albumDetails = await navidromeApi.getAlbum(albumId);
            if (albumDetails.song && albumDetails.song.length > 0) {
                actions.clearQueue();
                actions.insertAtIndex(albumDetails.song, 0);
                actions.play(albumDetails.song[0]);
            }
        } catch (err) {
            console.error("Failed to play album", err);
        }
    };

    const handleAddToQueue = async (e: React.MouseEvent, albumId: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const albumDetails = await navidromeApi.getAlbum(albumId);
            if (albumDetails.song && albumDetails.song.length > 0) {
                actions.addToQueue(albumDetails.song);
            }
        } catch (err) {
            console.error("Failed to add album to queue", err);
        }
    };

    const handleAddToPlaylist = (e: React.MouseEvent, albumId: string) => {
        e.preventDefault();
        e.stopPropagation();
        alert(`Add to Playlist not implemented yet (Album ID: ${albumId})`);
    };

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
        setIsFilterModalOpen(false);
    };

    const allAlbums = data?.pages.flatMap(page => page) || [];

    // Client-side filtering based on search query (like Artists component)
    const filteredAlbums = useMemo(() => {
        if (!searchQuery || !searchQuery.trim()) return allAlbums;

        const query = searchQuery.toLowerCase();
        return allAlbums.filter((album: Album) =>
            album.name.toLowerCase().includes(query) ||
            album.artist?.toLowerCase().includes(query)
        );
    }, [allAlbums, searchQuery]);

    if (isLoading) return <div>Loading albums...</div>;
    if (error) return <div>Error loading albums</div>;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <h1>Albums ({filteredAlbums.length})</h1>

            <ContentToolbar
                onSearch={setSearchQuery}
                onSortChange={setCurrentSort}
                onFilterClick={() => setIsFilterModalOpen(true)}
                onRefresh={() => window.location.reload()}
                onViewToggle={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                viewMode={viewMode}
                currentSort={currentSort}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />

            {viewMode === 'grid' ? (
                <div className="album-grid">
                    {filteredAlbums.map((album: Album, index: number) => {
                        const isLast = index === filteredAlbums.length - 1;
                        return (
                            <div
                                key={`${album.id}-${index}`}
                                ref={isLast ? lastAlbumRef : null}
                                className="album-card"
                            >
                                <div className="album-cover-container">
                                    <Link to={`/albums/${album.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                        <img
                                            src={getCoverArtUrl(album.id)}
                                            alt={album.name}
                                            className="album-cover"
                                            loading="lazy"
                                        />
                                    </Link>
                                    <div className="album-overlay">
                                        <button
                                            className="album-action-btn"
                                            title="Add to Playlist"
                                            onClick={(e) => handleAddToPlaylist(e, album.id)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>

                                        <button
                                            className="album-play-btn"
                                            title="Play Album"
                                            onClick={(e) => handlePlayAlbum(e, album.id)}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </button>

                                        <button
                                            className="album-action-btn"
                                            title="Add to Queue"
                                            onClick={(e) => handleAddToQueue(e, album.id)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    to={`/albums/${album.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <div className="album-info">
                                        <div className="album-name" title={album.name}>{album.name}</div>
                                        <div className="album-artist" title={album.artist}>{album.artist}</div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="album-list">
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem' }}>Cover</th>
                                <th style={{ padding: '0.5rem' }}>Album</th>
                                <th style={{ padding: '0.5rem' }}>Artist</th>
                                <th style={{ padding: '0.5rem' }}>Year</th>
                                <th style={{ padding: '0.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlbums.map((album: Album, index: number) => {
                                const isLast = index === filteredAlbums.length - 1;
                                return (
                                    <tr
                                        key={`${album.id}-${index}`}
                                        ref={isLast ? lastAlbumRef : null}
                                        style={{ borderBottom: '1px solid #222' }}
                                    >
                                        <td style={{ padding: '0.5rem', width: '60px' }}>
                                            <img
                                                src={getCoverArtUrl(album.id)}
                                                alt={album.name}
                                                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                loading="lazy"
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <Link to={`/albums/${album.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                                {album.name}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>{album.artist}</td>
                                        <td style={{ padding: '0.5rem' }}>{album.year}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button
                                                onClick={(e) => handlePlayAlbum(e, album.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', marginRight: '0.5rem' }}
                                                title="Play"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => handleAddToQueue(e, album.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                title="Add to Queue"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isFetchingNextPage && <div style={{ textAlign: 'center', padding: '1rem' }}>Loading more...</div>}
        </div>
    );
}
