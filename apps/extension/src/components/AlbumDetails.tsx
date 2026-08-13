import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../types';

export default function AlbumDetails() {
    const { id } = useParams<{ id: string }>();
    const { actions } = usePlayerStore();

    const { data: album, isLoading, error } = useQuery({
        queryKey: ['album', id],
        queryFn: () => navidromeApi.getAlbum(id!),
        enabled: !!id,
    });

    const handlePlay = (song: Song) => {
        actions.clearQueue();
        if (album?.song) {
            // Add all songs from album to queue
            album.song.forEach((s: Song) => actions.addToQueue(s));
            // Play selected song
            actions.play(song);
        } else {
            actions.addToQueue(song);
            actions.play(song);
        }
    };

    if (isLoading) return <div>Loading album...</div>;
    if (error) return <div>Error loading album</div>;
    if (!album) return <div>Album not found</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <img
                    src={getCoverArtUrl(album.coverArt || album.id)}
                    alt={album.name}
                    style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div>
                    <h1>{album.name}</h1>
                    <h2>{album.artist}</h2>
                    <p>{album.year} • {album.songCount} songs</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.isArray(album.song) && album.song.length > 0 ? (
                    album.song.map((song: Song, index: number) => (
                        <div
                            key={song.id}
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
                                transition: 'opacity 0.2s'
                            }}
                            onClick={() => handlePlay(song)}
                        >
                            <span style={{ width: '30px', color: '#888' }}>{index + 1}</span>
                            <div style={{ flex: 1 }}>{song.title}</div>
                            <div style={{ color: '#888' }}>{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '1rem', color: '#888' }}>No songs found in this album.</div>
                )}
            </div>
        </div>
    );
}
