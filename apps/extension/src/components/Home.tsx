import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import { playAlbum, playPlaylist } from '../lib/albumActions';
import { toggleStar, useIsStarred } from '../lib/starring';
import type { Album, Song } from '../types';
import HeartButton from './HeartButton';
import './Home.css';

const SHELF_SIZE = 9;

const pickRandom = <T,>(items: T[], count: number): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
};

const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

function HomeAlbumCard({ album }: { album: Album }) {
    const starred = useIsStarred(album.id, album.starred);
    return (
        <div className="media-card">
            <Link to={`/albums/${album.id}`} className="card-link">
                <div className="card-image-container">
                    <img src={getCoverArtUrl(album.coverArt || album.id, 300)} alt={album.name} className="card-image" loading="lazy" />
                    <HeartButton
                        className="card-heart"
                        starred={starred}
                        onToggle={() => void toggleStar('album', album.id, starred)}
                    />
                    <button
                        className="play-overlay-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void playAlbum(album.id);
                        }}
                        title="Play Album"
                    >
                        <PlayIcon />
                    </button>
                </div>
                <div className="card-info">
                    <div className="card-title" title={album.name}>{album.name}</div>
                    <div className="card-subtitle" title={album.artist}>{album.artist}</div>
                </div>
            </Link>
        </div>
    );
}

export default function Home() {
    const { playQueue } = usePlayerActions();

    const albumsQuery = useQuery({
        queryKey: ['albums', 'home-newest'],
        queryFn: () => navidromeApi.getAlbumList('newest', SHELF_SIZE),
    });

    const playlistsQuery = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    // Starred (hearted) songs, a fresh random handful per fetch.
    const favouritesQuery = useQuery({
        queryKey: ['starred', 'home-songs'],
        queryFn: async () => pickRandom((await navidromeApi.getStarred()).song, SHELF_SIZE),
    });

    const recentPlaylists = [...(playlistsQuery.data ?? [])]
        .sort((a, b) => new Date(b.changed).getTime() - new Date(a.changed).getTime())
        .slice(0, SHELF_SIZE);

    const playTrack = (song: Song) => playQueue([song], 0);

    const shelfStatus = (query: { isLoading: boolean; error: unknown }, empty: boolean, emptyText: string) => {
        if (query.isLoading) return <div className="empty-message">Loading...</div>;
        if (query.error) return <div className="empty-message error">Could not load: {describeError(query.error)}</div>;
        if (empty) return <div className="empty-message">{emptyText}</div>;
        return null;
    };

    return (
        <div className="home-container">
            <h1 className="home-title">Home</h1>

            <section className="home-section">
                <div className="section-header">
                    <h2>Recent Albums</h2>
                    <Link to="/albums" className="see-all-link">See all</Link>
                </div>
                <div className="horizontal-scroll">
                    {shelfStatus(albumsQuery, !albumsQuery.data?.length, 'No recent albums found')
                        ?? albumsQuery.data!.map(album => <HomeAlbumCard key={album.id} album={album} />)}
                </div>
            </section>

            <section className="home-section">
                <div className="section-header">
                    <h2>Recently Edited Playlists</h2>
                    <Link to="/playlists" className="see-all-link">See all</Link>
                </div>
                <div className="horizontal-scroll">
                    {shelfStatus(playlistsQuery, recentPlaylists.length === 0, 'No playlists found')
                        ?? recentPlaylists.map(playlist => (
                            <div key={playlist.id} className="media-card">
                                <Link to={`/playlists/${playlist.id}`} className="card-link">
                                    <div className="card-image-container">
                                        {playlist.coverArt ? (
                                            <img src={getCoverArtUrl(playlist.coverArt, 300)} alt={playlist.name} className="card-image" loading="lazy" />
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
                                                void playPlaylist(playlist.id);
                                            }}
                                            title="Play Playlist"
                                        >
                                            <PlayIcon />
                                        </button>
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title" title={playlist.name}>{playlist.name}</div>
                                        <div className="card-subtitle">{playlist.songCount} songs</div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                </div>
            </section>

            <section className="home-section">
                <div className="section-header">
                    <h2>Favorite Tracks</h2>
                </div>
                <div className="horizontal-scroll">
                    {shelfStatus(favouritesQuery, !favouritesQuery.data?.length, 'No favorite tracks yet. Tap the heart on a song to add it here.')
                        ?? favouritesQuery.data!.map(song => (
                            <div key={song.id} className="media-card">
                                <button type="button" className="card-link card-button" onClick={() => playTrack(song)}>
                                    <div className="card-image-container">
                                        <img src={getCoverArtUrl(song.coverArt || song.id, 300)} alt={song.title} className="card-image" loading="lazy" />
                                        <span className="play-overlay-btn" aria-hidden="true">
                                            <PlayIcon />
                                        </span>
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title" title={song.title}>{song.title}</div>
                                        <div className="card-subtitle" title={song.artist}>{song.artist}</div>
                                    </div>
                                </button>
                            </div>
                        ))}
                </div>
            </section>
        </div>
    );
}
