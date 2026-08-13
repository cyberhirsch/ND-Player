import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import type { Album } from '../types';

export default function ArtistDetails() {
    const { id } = useParams<{ id: string }>();

    const { data: artist, isLoading, error } = useQuery({
        queryKey: ['artist', id],
        queryFn: () => navidromeApi.getArtist(id!),
        enabled: !!id,
    });

    if (isLoading) return <div>Loading artist...</div>;
    if (error) return <div>Error loading artist</div>;
    if (!artist) return <div>Artist not found</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                {artist.coverArt ? (
                    <img
                        src={getCoverArtUrl(artist.coverArt)}
                        alt={artist.name}
                        style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                ) : (
                    <div style={{ width: '200px', height: '200px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                )}
                <div>
                    <h1>{artist.name}</h1>
                    <p>{artist.albumCount} albums</p>
                    {artist.biography && <p style={{ color: '#aaa', marginTop: '0.5rem', maxWidth: '600px' }}>{artist.biography}</p>}
                </div>
            </div>

            <h2>Albums</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {artist.album?.map((album: Album) => (
                    <Link
                        to={`/albums/${album.id}`}
                        key={album.id}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="album-card">
                            <div className="album-cover-container">
                                <img
                                    src={getCoverArtUrl(album.id)}
                                    alt={album.name}
                                    className="album-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="album-info">
                                <div className="album-name">{album.name}</div>
                                <div className="album-artist">{album.year} • {album.songCount} songs</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
