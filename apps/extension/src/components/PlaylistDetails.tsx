import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import { formatDuration, SONG_DRAG_TYPE } from '../lib/format';

export default function PlaylistDetails() {
    const { id = '' } = useParams<{ id: string }>();
    const { playQueue } = usePlayerActions();

    const { data: playlist, isLoading, error } = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => navidromeApi.getPlaylist(id),
        enabled: !!id,
    });

    if (isLoading) return <div className="page-status">Loading playlist...</div>;
    if (error) return <div className="page-status error">Could not load playlist: {describeError(error)}</div>;
    if (!playlist) return <div className="page-status">Playlist not found</div>;

    const tracks = playlist.entry ?? [];

    return (
        <div className="detail-page">
            <div className="detail-header">
                {playlist.coverArt ? (
                    <img src={getCoverArtUrl(playlist.coverArt, 400)} alt={playlist.name} className="detail-cover" />
                ) : (
                    <div className="detail-cover placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>
                )}
                <div className="detail-meta">
                    <h1>{playlist.name}</h1>
                    <p>{playlist.songCount} songs{playlist.duration ? ` • ${Math.floor(playlist.duration / 60)} mins` : ''}</p>
                    {playlist.comment && <p className="muted">{playlist.comment}</p>}
                    <div className="detail-actions">
                        <button className="btn-primary" onClick={() => playQueue(tracks, 0)} disabled={tracks.length === 0}>Play</button>
                    </div>
                </div>
            </div>

            <div className="track-list">
                {tracks.map((song, index) => (
                    <div
                        key={`${song.id}-${index}`}
                        className="track-row"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData(SONG_DRAG_TYPE, JSON.stringify({ type: 'song', song }));
                        }}
                        onClick={() => playQueue(tracks, index)}
                    >
                        <span className="track-number">{index + 1}</span>
                        <div className="track-title">
                            <div>{song.title}</div>
                            <div className="track-sub">{song.artist} • {song.album}</div>
                        </div>
                        <div className="track-duration">{formatDuration(song.duration)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
