import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { describeError, navidromeApi } from '../api/navidrome';
import { toggleStar, useIsStarred } from '../lib/starring';
import type { Artist } from '../types';
import ContentToolbar, { type SortOption } from './ContentToolbar';
import HeartButton from './HeartButton';

const SORT_OPTIONS: SortOption[] = [
    { label: 'Name', value: 'name' },
    { label: 'Album Count', value: 'albumCount' },
    { label: 'Favourites First', value: 'starred' },
];

function ArtistCard({ artist, viewMode }: { artist: Artist; viewMode: 'grid' | 'list' }) {
    const starred = useIsStarred(artist.id, artist.starred);
    return (
        <Link to={`/artists/${artist.id}`} className={`artist-card ${viewMode}`}>
            <HeartButton
                className="card-heart artist-heart"
                size={16}
                starred={starred}
                onToggle={() => void toggleStar('artist', artist.id, starred)}
            />
            <div className="artist-card-name" title={artist.name}>{artist.name}</div>
            <div className="artist-card-meta">
                {artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}
            </div>
        </Link>
    );
}

export default function Artists() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('name');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // getArtists returns the whole library in one response, so filtering it locally is complete.
    const { data: artists, isLoading, error, refetch } = useQuery({
        queryKey: ['artists'],
        queryFn: navidromeApi.getArtists,
    });

    const filteredArtists = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const result = (artists ?? []).filter(artist => !query || artist.name.toLowerCase().includes(query));
        return result.sort((a, b) => {
            if (sort === 'albumCount') return (b.albumCount || 0) - (a.albumCount || 0) || a.name.localeCompare(b.name);
            if (sort === 'starred') return Number(!!b.starred) - Number(!!a.starred) || a.name.localeCompare(b.name);
            return a.name.localeCompare(b.name);
        });
    }, [artists, searchQuery, sort]);

    return (
        <div className="artists-page">
            <h1>Artists</h1>
            <ContentToolbar
                onSearch={setSearchQuery}
                searchPlaceholder="Search artists..."
                sortOptions={SORT_OPTIONS}
                currentSort={sort}
                onSortChange={setSort}
                onRefresh={() => void refetch()}
                viewMode={viewMode}
                onViewToggle={() => setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))}
            />

            {isLoading && <div className="page-status">Loading artists...</div>}
            {error && <div className="page-status error">Could not load artists: {describeError(error)}</div>}

            {!isLoading && !error && (
                <div className={`artist-grid ${viewMode}`}>
                    {filteredArtists.length > 0
                        ? filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} viewMode={viewMode} />)
                        : <div className="page-status">No artists found</div>}
                </div>
            )}
        </div>
    );
}
