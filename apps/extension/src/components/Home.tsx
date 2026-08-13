import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song, Album, Playlist } from '../types';
import './Home.css';

export default function Home() {
    const { actions } = usePlayerStore();

    // Fetch recent albums
    const { data: recentAlbums, isLoading: albumsLoading } = useQuery({
        queryKey: ['recentAlbums'],
        queryFn: () => navidromeApi.getAlbumList('newest', 9),
    });

    // Fetch playlists and sort by recently edited
    const { data: allPlaylists, isLoading: playlistsLoading } = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    // Fetch favorite (5-star) tracks
    const { data: favoriteTracks, isLoading: tracksLoading } = useQuery({
        queryKey: ['favoriteTracks'],
        queryFn: () => navidromeApi.getSongsByRating(5, 50),
    });

    // Sort playlists by changed date (most recent first)
    const recentPlaylists = allPlaylists
        ? [...allPlaylists].sort((a, b) =>
            new Date(b.changed).getTime() - new Date(a.changed).getTime()
        ).slice(0, 9)
        : [];

    const handlePlayAlbum = async (albumId: string) => {
        try {
            const albumDetails = await navidromeApi.getAlbum(albumId);
            if (albumDetails.song && albumDetails.song.length > 0) {
                actions.clearQueue();
                actions.addToQueue(albumDetails.song);
                actions.play(albumDetails.song[0]);
            }
        } catch (err) {
            console.error("Failed to play album", err);
        }
    };

    const handlePlayPlaylist = async (playlistId: string) => {
        try {
            const playlistDetails = await navidromeApi.getPlaylist(playlistId);
            if (playlistDetails.entry && playlistDetails.entry.length > 0) {
                actions.clearQueue();
                actions.addToQueue(playlistDetails.entry);
                actions.play(playlistDetails.entry[0]);
            }
        } catch (err) {
            console.error("Failed to play playlist", err);
        }
    };

    const handlePlayTrack = (song: Song) => {
        actions.clearQueue();
        actions.addToQueue(song);
        actions.play(song);
    };

    if (albumsLoading || playlistsLoading || tracksLoading) {
        return <div className="home-loading">Loading...</div>;
    }

    return (
        <div className="home-container">
            <h1 className="home-title">Home</h1>

            {/* Recent Albums Section */}
            <section className="home-section">
                <div className="section-header">
                    <h2>Recent Albums</h2>
                    <Link to="/albums" className="see-all-link">See all</Link>
                </div>
                <div className="horizontal-scroll">
                    {recentAlbums && recentAlbums.length > 0 ? (
                        recentAlbums.map((album: Album) => (
                            <div key={album.id} className="media-card">
                                <Link to={`/albums/${album.id}`} className="card-link">
                                    <div className="card-image-container">
                                        <img
                                            src={getCoverArtUrl(album.id)}
                                            alt={album.name}
                                            className="card-image"
                                            loading="lazy"
                                        />
                                        <button
                                            className="play-overlay-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePlayAlbum(album.id);
                                            }}
                                            title="Play Album"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title" title={album.name}>{album.name}</div>
                                        <div className="card-subtitle" title={album.artist}>{album.artist}</div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">No recent albums found</div>
                    )}
                </div>
            </section>

            {/* Recently Edited Playlists Section */}
            <section className="home-section">
                <div className="section-header">
                    <h2>Recently Edited Playlists</h2>
                    <Link to="/playlists" className="see-all-link">See all</Link>
                </div>
                <div className="horizontal-scroll">
                    {recentPlaylists && recentPlaylists.length > 0 ? (
                        recentPlaylists.map((playlist: Playlist) => (
                            <div key={playlist.id} className="media-card">
                                <Link to={`/playlists/${playlist.id}`} className="card-link">
                                    <div className="card-image-container">
                                        {playlist.coverArt ? (
                                            <img
                                                src={getCoverArtUrl(playlist.coverArt)}
                                                alt={playlist.name}
                                                className="card-image"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="card-placeholder">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                                </svg>
                                            </div>
                                        )}
                                        <button
                                            className="play-overlay-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePlayPlaylist(playlist.id);
                                            }}
                                            title="Play Playlist"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title" title={playlist.name}>{playlist.name}</div>
                                        <div className="card-subtitle">{playlist.songCount} songs</div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">No playlists found</div>
                    )}
                </div>
            </section>

            {/* Favorite Tracks Section */}
            <section className="home-section">
                <div className="section-header">
                    <h2>Favorite Tracks</h2>
                </div>
                <div className="horizontal-scroll">
                    {favoriteTracks && favoriteTracks.length > 0 ? (
                        favoriteTracks.slice(0, 9).map((song: Song) => (
                            <div key={song.id} className="media-card">
                                <div className="card-link" onClick={() => handlePlayTrack(song)} style={{ cursor: 'pointer' }}>
                                    <div className="card-image-container">
                                        <img
                                            src={getCoverArtUrl(song.id)}
                                            alt={song.title}
                                            className="card-image"
                                            loading="lazy"
                                        />
                                        <button
                                            className="play-overlay-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayTrack(song);
                                            }}
                                            title="Play Track"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title" title={song.title}>{song.title}</div>
                                        <div className="card-subtitle" title={song.artist}>{song.artist}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">No 5-star tracks found. Start rating your favorite songs!</div>
                    )}
                </div>
            </section>
        </div>
    );
}
