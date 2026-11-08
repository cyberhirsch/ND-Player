import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { playAlbum, queueAlbum } from '../lib/albumActions';
import { toggleStar, useIsStarred } from '../lib/starring';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import type { Album, AlbumListType } from '../types';
import ContentToolbar, { type SortOption } from './ContentToolbar';
import FilterModal from './FilterModal';
import { describeFilter, NO_FILTER, type AlbumFilter } from '../lib/albumFilter';
import AlbumCard from './AlbumCard';
import HeartButton from './HeartButton';

const PAGE_SIZE = 50;

const SORT_OPTIONS: SortOption[] = [
    { label: 'Recently Added', value: 'newest' },
    { label: 'Name', value: 'alphabeticalByName' },
    { label: 'Artist', value: 'alphabeticalByArtist' },
    { label: 'Most Played', value: 'frequent' },
    { label: 'Recently Played', value: 'recent' },
    { label: 'Top Rated', value: 'highest' },
    { label: 'Random', value: 'random' },
];

const listTypeFor = (filter: AlbumFilter, sort: AlbumListType): AlbumListType => {
    switch (filter.kind) {
        case 'starred': return 'starred';
        case 'genre': return 'byGenre';
        case 'year': return 'byYear';
        default: return sort;
    }
};

function AlbumRow({ album }: { album: Album }) {
    const starred = useIsStarred(album.id, album.starred);
    return (
        <tr className="album-row">
            <td className="album-row-cover">
                <img src={getCoverArtUrl(album.coverArt || album.id, 80)} alt={album.name} loading="lazy" />
            </td>
            <td>
                <Link to={`/albums/${album.id}`} className="album-row-title">{album.name}</Link>
            </td>
            <td>{album.artist}</td>
            <td>{album.year}</td>
            <td className="album-row-actions">
                <button className="row-btn accent" onClick={() => void playAlbum(album.id)} title="Play">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
                <button className="row-btn" onClick={() => void queueAlbum(album.id, album.name)} title="Add to Queue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
                <HeartButton className="row-btn" starred={starred} onToggle={() => void toggleStar('album', album.id, starred)} />
            </td>
        </tr>
    );
}

export default function Albums() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sort, setSort] = useState<AlbumListType>('newest');
    const [filter, setFilter] = useState<AlbumFilter>(NO_FILTER);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const query = useDebouncedValue(search.trim(), 300);

    const listType = listTypeFor(filter, sort);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfiniteQuery({
        // Searching uses the server (search3) so the whole library is searched, not just loaded pages.
        queryKey: query ? ['albums', 'search', query] : ['albums', 'list', listType, filter],
        queryFn: ({ pageParam }) => query
            ? navidromeApi.searchAlbums(query, PAGE_SIZE, pageParam)
            : navidromeApi.getAlbumList(listType, PAGE_SIZE, pageParam, {
                genre: filter.kind === 'genre' ? filter.genre : undefined,
                fromYear: filter.kind === 'year' ? filter.fromYear : undefined,
                toYear: filter.kind === 'year' ? filter.toYear : undefined,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined),
    });

    // Random pages can repeat albums; show each once.
    const albums = useMemo(() => {
        const seen = new Set<string>();
        return (data?.pages.flat() ?? []).filter(album => {
            if (seen.has(album.id)) return false;
            seen.add(album.id);
            return true;
        });
    }, [data]);

    // Infinite scroll: load the next page when the sentinel below the list comes into view.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasNextPage) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage();
        }, { rootMargin: '400px' });
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, albums.length]);

    const filterLabel = describeFilter(filter);

    return (
        <div className="albums-page">
            <h1>Albums</h1>

            <ContentToolbar
                onSearch={setSearch}
                searchPlaceholder="Search all albums..."
                sortOptions={filter.kind === 'none' ? SORT_OPTIONS : undefined}
                currentSort={sort}
                onSortChange={(value) => setSort(value as AlbumListType)}
                onFilterClick={() => setIsFilterModalOpen(true)}
                filterActive={filter.kind !== 'none'}
                onRefresh={() => void refetch()}
                viewMode={viewMode}
                onViewToggle={() => setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))}
            />

            {(query || filterLabel) && (
                <div className="active-filters">
                    {query && <span className="chip">Search: "{query}"{filterLabel && ' — filters are ignored while searching'}</span>}
                    {filterLabel && (
                        <span className="chip">
                            {filterLabel}
                            <button className="chip-clear" onClick={() => setFilter(NO_FILTER)} aria-label="Clear filter">×</button>
                        </span>
                    )}
                </div>
            )}

            {isFilterModalOpen && (
                <FilterModal
                    initialFilter={filter}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(next) => {
                        setFilter(next);
                        setIsFilterModalOpen(false);
                    }}
                />
            )}

            {isLoading && <div className="page-status">Loading albums...</div>}
            {error && <div className="page-status error">Could not load albums: {describeError(error)}</div>}
            {!isLoading && !error && albums.length === 0 && (
                <div className="page-status">{query ? `No albums match "${query}".` : 'No albums found.'}</div>
            )}

            {albums.length > 0 && (viewMode === 'grid' ? (
                <div className="album-grid">
                    {albums.map(album => <AlbumCard key={album.id} album={album} />)}
                </div>
            ) : (
                <div className="album-list">
                    <table className="album-table">
                        <thead>
                            <tr>
                                <th>Cover</th>
                                <th>Album</th>
                                <th>Artist</th>
                                <th>Year</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {albums.map(album => <AlbumRow key={album.id} album={album} />)}
                        </tbody>
                    </table>
                </div>
            ))}

            <div ref={sentinelRef} className="scroll-sentinel" />
            {isFetchingNextPage && <div className="page-status">Loading more...</div>}
        </div>
    );
}
