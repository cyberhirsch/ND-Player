import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../types';

export default function PlaylistDetails() {
    const { id } = useParams<{ id: string }>();
    const { actions } = usePlayerStore();

    const { data: playlist, isLoading, error } = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => navidromeApi.getPlaylist(id!),
        enabled: !!id,
    });

    const handlePlay = (song: Song) => {
        actions.clearQueue();
        if (playlist?.entry) {
            // Add all songs from playlist to queue
            actions.addToQueue(playlist.entry);
            // Play selected song
            actions.play(song);
        } else {
            actions.addToQueue(song);
            actions.play(song);
        }
    };

    if (isLoading) return <div>Loading playlist...</div>;
    if (error) return <div>Error loading playlist</div>;
    if (!playlist) return <div>Playlist not found</div>;

    const tracks = playlist.entry || [];

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                {playlist.coverArt ? (
                    <img
                        src={getCoverArtUrl(playlist.coverArt)}
                        alt={playlist.name}
                        style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                ) : (
                    <div style={{ width: '200px', height: '200px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>
                )}
                <div>
                    <h1>{playlist.name}</h1>
                    <p>{playlist.songCount} songs • {playlist.duration ? Math.floor(playlist.duration / 60) + ' mins' : ''}</p>
                    {playlist.comment && <p style={{ color: '#aaa', marginTop: '0.5rem' }}>{playlist.comment}</p>}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tracks.map((song: Song, index: number) => (
                    <div
                        key={`${song.id}-${index}`}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData('application/json', JSON.stringify({
                                type: 'song',
                                song: song
                            }));
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onClick={() => handlePlay(song)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        <span style={{ width: '40px', color: '#888', textAlign: 'center' }}>{index + 1}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{song.title}</div>
                            <div style={{ fontSize: '0.9em', color: '#aaa' }}>{song.artist} • {song.album}</div>
                        </div>
                        <div style={{ color: '#888', marginRight: '1rem' }}>
                            {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
