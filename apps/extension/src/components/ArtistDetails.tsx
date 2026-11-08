import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { toggleStar, useIsStarred } from '../lib/starring';
import AlbumCard from './AlbumCard';
import HeartButton from './HeartButton';

export default function ArtistDetails() {
    const { id = '' } = useParams<{ id: string }>();

    const { data: artist, isLoading, error } = useQuery({
        queryKey: ['artist', id],
        queryFn: () => navidromeApi.getArtist(id),
        enabled: !!id,
    });

    const starred = useIsStarred(id, artist?.starred);

    if (isLoading) return <div className="page-status">Loading artist...</div>;
    if (error) return <div className="page-status error">Could not load artist: {describeError(error)}</div>;
    if (!artist) return <div className="page-status">Artist not found</div>;

    return (
        <div className="detail-page">
            <div className="detail-header">
                {artist.coverArt ? (
                    <img src={getCoverArtUrl(artist.coverArt, 400)} alt={artist.name} className="detail-cover round" />
                ) : (
                    <div className="detail-cover round placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                )}
                <div className="detail-meta">
                    <h1>{artist.name}</h1>
                    <p>{artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}</p>
                    <HeartButton starred={starred} onToggle={() => void toggleStar('artist', artist.id, starred)} />
                </div>
            </div>

            <h2>Albums</h2>
            <div className="album-grid">
                {(artist.album ?? []).map(album => (
                    <AlbumCard
                        key={album.id}
                        album={album}
                        subtitle={[album.year, `${album.songCount} songs`].filter(Boolean).join(' • ')}
                    />
                ))}
            </div>
        </div>
    );
}
