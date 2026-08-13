import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { navidromeApi } from '../api/navidrome';
import ContentToolbar from './ContentToolbar';
import type { Artist } from '../types';

export default function Artists() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('alphabetical');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: artists, isLoading, error, refetch } = useQuery({
        queryKey: ['artists'],
        queryFn: () => navidromeApi.getArtists(),
    });

    const filteredArtists = useMemo(() => {
        if (!artists) return [];
        let result = [...artists];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(artist =>
                artist.name.toLowerCase().includes(query)
            );
        }

        // Sort logic (basic implementation)
        result.sort((a, b) => {
            if (sort === 'alphabetical') return a.name.localeCompare(b.name);
            if (sort === 'albumCount') return (b.albumCount || 0) - (a.albumCount || 0);
            return 0;
        });

        return result;
    }, [artists, searchQuery, sort]);

    if (isLoading) return <div>Loading artists...</div>;
    if (error) return <div>Error loading artists</div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ContentToolbar
                onSearch={setSearchQuery}
                onSortChange={setSort}
                onFilterClick={() => { }} // No advanced filters for artists yet
                onRefresh={refetch}
                onViewToggle={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                viewMode={viewMode}
                currentSort={sort}
            />

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(150px, 1fr))' : '1fr',
                    gap: '1rem'
                }}>
                    {filteredArtists.length > 0 ? filteredArtists.map((artist: Artist) => (
                        <Link
                            to={`/artists/${artist.id}`}
                            key={artist.id}
                            style={{
                                padding: '1rem',
                                background: '#333',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                color: 'inherit',
                                display: viewMode === 'list' ? 'flex' : 'block',
                                alignItems: viewMode === 'list' ? 'center' : undefined,
                                justifyContent: viewMode === 'list' ? 'space-between' : undefined
                            }}
                        >
                            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist.name}</div>
                            <div style={{ fontSize: '0.8em', color: '#ccc' }}>{artist.albumCount} albums</div>
                        </Link>
                    )) : <div>No artists found</div>}
                </div>
            </div>
        </div>
    );
}
