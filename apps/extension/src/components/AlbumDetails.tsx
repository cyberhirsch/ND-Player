import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import { toggleStar, useIsStarred } from '../lib/starring';
import { formatDuration, SONG_DRAG_TYPE } from '../lib/format';
import HeartButton from './HeartButton';
import AddToPlaylistModal from './AddToPlaylistModal';

export default function AlbumDetails() {
    const { id = '' } = useParams<{ id: string }>();
    const { playQueue, addToQueue } = usePlayerActions();
    const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

    const { data: album, isLoading, error } = useQuery({
        queryKey: ['album', id],
        queryFn: () => navidromeApi.getAlbum(id),
        enabled: !!id,
    });

    const starred = useIsStarred(id, album?.starred);

    if (isLoading) return <div className="page-status">Loading album...</div>;
    if (error) return <div className="page-status error">Could not load album: {describeError(error)}</div>;
    if (!album) return <div className="page-status">Album not found</div>;

    const songs = album.song ?? [];

    return (
        <div className="detail-page">
            <div className="detail-header">
                <img src={getCoverArtUrl(album.coverArt || album.id, 400)} alt={album.name} className="detail-cover" />
                <div className="detail-meta">
                    <h1>{album.name}</h1>
                    <h2>{album.artist}</h2>
                    <p>{[album.year, `${album.songCount} songs`].filter(Boolean).join(' • ')}</p>
                    <div className="detail-actions">
                        <button className="btn-primary" onClick={() => playQueue(songs, 0)} disabled={songs.length === 0}>Play</button>
                        <button className="btn-secondary" onClick={() => addToQueue(songs)} disabled={songs.length === 0}>Add to queue</button>
                        <button className="btn-secondary" onClick={() => setShowPlaylistPicker(true)} disabled={songs.length === 0}>Add to playlist</button>
                        <HeartButton starred={starred} onToggle={() => void toggleStar('album', album.id, starred)} />
                    </div>
                </div>
            </div>

            <div className="track-list">
                {songs.length > 0 ? songs.map((song, index) => (
                    <div
                        key={song.id}
                        className="track-row"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData(SONG_DRAG_TYPE, JSON.stringify({ type: 'song', song }));
                        }}
                        onClick={() => playQueue(songs, index)}
                    >
                        <span className="track-number">{song.track ?? index + 1}</span>
                        <div className="track-title">{song.title}</div>
                        <div className="track-duration">{formatDuration(song.duration)}</div>
                    </div>
                )) : (
                    <div className="page-status">No songs found in this album.</div>
                )}
            </div>

            {showPlaylistPicker && (
                <AddToPlaylistModal
                    label={album.name}
                    loadSongIds={async () => songs.map(song => song.id)}
                    onClose={() => setShowPlaylistPicker(false)}
                />
            )}
        </div>
    );
}
