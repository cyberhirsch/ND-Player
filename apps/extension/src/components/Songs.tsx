import { useEffect, useState } from 'react';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { formatDuration, SONG_DRAG_TYPE } from '../lib/format';
import type { Song } from '../types';
import ContentToolbar from './ContentToolbar';

const PAGE_SIZE = 50;

export default function Songs() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [error, setError] = useState<string | null>(null);
    /** Key of the last finished request; loading means the current key has not finished yet. */
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const query = useDebouncedValue(search.trim(), 300);
    const { playQueue } = usePlayerActions();
    const requestKey = `${query}|${page}|${refreshKey}`;
    const loading = loadedKey !== requestKey;

    // A new query or refresh starts again from page 0. Stale responses are ignored.
    useEffect(() => {
        let cancelled = false;
        navidromeApi.getSongs(page * PAGE_SIZE, PAGE_SIZE, query)
            .then(newSongs => {
                if (cancelled) return;
                setSongs(prev => (page === 0 ? newSongs : [...prev, ...newSongs]));
                setHasMore(newSongs.length === PAGE_SIZE);
                setError(null);
            })
            .catch(err => {
                if (!cancelled) setError(describeError(err));
            })
            .finally(() => {
                if (!cancelled) setLoadedKey(`${query}|${page}|${refreshKey}`);
            });
        return () => {
            cancelled = true;
        };
    }, [page, query, refreshKey]);

    const restart = () => {
        setPage(0);
        setRefreshKey(k => k + 1);
    };

    return (
        <div className="content-area songs-page">
            <div className="songs-header">
                <h1>Songs</h1>
                <ContentToolbar
                    onSearch={(value) => {
                        setSearch(value);
                        setPage(0);
                    }}
                    searchPlaceholder="Search songs..."
                    onRefresh={restart}
                />
            </div>

            <div className="song-list-container">
                <div className="song-list">
                    {songs.map((song, index) => (
                        <div
                            key={`${song.id}-${index}`}
                            className="song-item"
                            onClick={() => playQueue(songs, index)}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData(SONG_DRAG_TYPE, JSON.stringify({ type: 'song', song }));
                                e.dataTransfer.effectAllowed = 'copy';
                            }}
                        >
                            <img
                                src={getCoverArtUrl(song.coverArt || song.id, 80)}
                                alt=""
                                className="song-cover"
                                loading="lazy"
                                onError={(e) => e.currentTarget.classList.add('missing')}
                            />
                            <div className="song-info">
                                <div className="song-title">{song.title}</div>
                                <div className="song-artist">{song.artist}</div>
                            </div>
                            <div className="song-duration">{formatDuration(song.duration)}</div>
                        </div>
                    ))}
                </div>
                {error && <div className="page-status error">Could not load songs: {error}</div>}
                {loading && <div className="page-status">Loading...</div>}
                {!loading && !error && hasMore && (
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="load-more-btn"
                    >
                        Load More
                    </button>
                )}
                {!loading && !error && songs.length === 0 && (
                    <div className="page-status">{query ? `No songs match "${query}".` : 'No songs found'}</div>
                )}
            </div>
        </div>
    );
}
