import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import type { Playlist } from '../types';

export default function Playlists() {
    const { data: playlists, isLoading, error } = useQuery({
        queryKey: ['playlists'],
        queryFn: () => navidromeApi.getPlaylists(),
    });

    if (isLoading) return <div>Loading playlists...</div>;
    if (error) return <div>Error loading playlists</div>;

    return (
        <div>
            <h1>Playlists</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {Array.isArray(playlists) ? playlists.map((playlist: Playlist) => (
                    <Link
                        to={`/playlists/${playlist.id}`}
                        key={playlist.id}
                        style={{ padding: '1rem', background: '#333', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                        {playlist.coverArt && (
                            <img
                                src={getCoverArtUrl(playlist.coverArt)}
                                alt={playlist.name}
                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }}
                                loading="lazy"
                            />
                        )}
                        <div style={{ marginTop: '0.5rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</div>
                        <div style={{ fontSize: '0.8em', color: '#ccc' }}>{playlist.songCount} songs</div>
                    </Link>
                )) : <div>No playlists found</div>}
            </div>
        </div>
    );
}
