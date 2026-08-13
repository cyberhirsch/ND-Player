import { useEffect, useState, useCallback } from 'react';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import type { Song } from '../types';
import ContentToolbar from './ContentToolbar';

export default function Songs() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 50;
    const { play, clearQueue, addToQueue } = usePlayerActions();

    const loadSongs = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentPage = reset ? 0 : page;
            const newSongs = await navidromeApi.getSongs(currentPage * PAGE_SIZE, PAGE_SIZE, searchQuery);

            if (newSongs.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setSongs(prev => reset ? newSongs : [...prev, ...newSongs]);
        } catch (error) {
            console.error('Failed to load songs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        loadSongs(page === 0);
    }, [page, loadSongs]);

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    const handlePlay = (song: Song) => {
        clearQueue();
        addToQueue(songs);
        play(song);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleDragStart = (e: React.DragEvent, song: Song) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'song', song }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="content-area" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 1rem' }}>
                <h1>Songs</h1>
                <ContentToolbar
                    onSearch={handleSearch}
                    onSortChange={() => { }} // Not implemented yet
                    onFilterClick={() => { }} // Not implemented yet
                    onRefresh={() => {
                        setPage(0);
                        loadSongs(true);
                    }}
                    onViewToggle={() => { }} // Only list view for now
                    viewMode="list"
                    currentSort="default"
                />
            </div>

            <div className="song-list-container" style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
                <div className="song-list">
                    {songs.map((song) => (
                        <div
                            key={song.id}
                            className="song-item"
                            onClick={() => handlePlay(song)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, song)}
                        >
                            <img
                                src={getCoverArtUrl(song.id)}
                                alt={song.title}
                                className="song-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/default-album.png';
                                }}
                            />
                            <div className="song-info">
                                <div className="song-title">{song.title}</div>
                                <div className="song-artist">{song.artist}</div>
                            </div>
                            <div className="song-duration">
                                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    ))}
                </div>
                {loading && <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>}
                {!loading && hasMore && (
                    <button onClick={() => setPage(p => p + 1)} className="load-more-btn">
                        Load More
                    </button>
                )}
                {!loading && songs.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center' }}>No songs found</div>
                )}
            </div>
            <style>{`
                .song-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .song-item {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .song-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .song-cover {
                    width: 40px;
                    height: 40px;
                    border-radius: 4px;
                    margin-right: 12px;
                    object-fit: cover;
                }
                .song-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .song-title {
                    font-weight: 500;
                    color: white;
                }
                .song-artist {
                    font-size: 0.9em;
                    color: #aaa;
                }
                .song-duration {
                    color: #aaa;
                    font-family: monospace;
                }
                .load-more-btn {
                    margin: 20px auto;
                    display: block;
                    padding: 10px 20px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .load-more-btn:hover {
                    background: #444;
                }
            `}</style>
        </div>
    );
}
