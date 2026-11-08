import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';

export default function Playlists() {
    const { data: playlists = [], isLoading, error } = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    if (isLoading) return <div className="page-status">Loading playlists...</div>;
    if (error) return <div className="page-status error">Could not load playlists: {describeError(error)}</div>;

    return (
        <div>
            <h1>Playlists</h1>
            {playlists.length === 0 ? (
                <div className="page-status">No playlists yet.</div>
            ) : (
                <div className="playlist-grid">
                    {playlists.map(playlist => (
                        <Link to={`/playlists/${playlist.id}`} key={playlist.id} className="playlist-card">
                            {playlist.coverArt && (
                                <img src={getCoverArtUrl(playlist.coverArt, 300)} alt={playlist.name} loading="lazy" />
                            )}
                            <div className="playlist-card-name">{playlist.name}</div>
                            <div className="playlist-card-meta">{playlist.songCount} songs</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
