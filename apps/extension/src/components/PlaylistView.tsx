import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { describeError, navidromeApi } from '../api/navidrome';
import { usePlayerActions } from '../store/usePlayerStore';
import { toast } from '../store/useToastStore';
import { isExternalDrag, songsFromDrop } from '../lib/drop';
import type { Playlist, Song } from '../types';

interface PlaylistViewProps {
    playlistId: string;
}

export default function PlaylistView({ playlistId }: PlaylistViewProps) {
    const { data: playlist, isLoading, error } = useQuery({
        queryKey: ['playlist', playlistId],
        queryFn: () => navidromeApi.getPlaylist(playlistId),
        enabled: !!playlistId,
    });

    if (isLoading) return <div className="page-status">Loading playlist...</div>;
    if (error) return <div className="page-status error">Could not load playlist: {describeError(error)}</div>;
    if (!playlist) return <div className="page-status">Playlist not found</div>;

    // Remount the editor whenever the server copy changes, so local edits start from fresh data.
    return <PlaylistEditor key={`${playlist.id}-${playlist.changed}`} playlist={playlist} />;
}

function PlaylistEditor({ playlist }: { playlist: Playlist }) {
    const { playQueue } = usePlayerActions();
    const queryClient = useQueryClient();
    const serverTracks = playlist.entry ?? [];
    const [tracks, setTracks] = useState<Song[]>(serverTracks);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDropZone, setIsDropZone] = useState(false);

    const edit = (next: Song[]) => {
        setTracks(next);
        setHasUnsavedChanges(true);
    };

    const insertDropped = async (e: React.DragEvent, index: number | null) => {
        try {
            const songs = await songsFromDrop(e);
            if (songs.length === 0) return;
            setTracks(prev => {
                const next = [...prev];
                next.splice(index ?? next.length, 0, ...songs);
                return next;
            });
            setHasUnsavedChanges(true);
        } catch (err) {
            toast.error(`Could not add songs: ${describeError(err)}`);
        }
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIndex(null);
        setIsDropZone(false);
        setDraggedIndex(null);

        if (isExternalDrag(e)) {
            void insertDropped(e, toIndex);
            return;
        }
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
            const next = [...tracks];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            edit(next);
        }
    };

    const handleItemClick = (index: number, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedIndices(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
        } else if (e.shiftKey && selectedIndices.length > 0) {
            const lastSelected = selectedIndices[selectedIndices.length - 1];
            const start = Math.min(lastSelected, index);
            const end = Math.max(lastSelected, index);
            setSelectedIndices(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        } else {
            setSelectedIndices([index]);
            playQueue(tracks, index);
        }
    };

    const handleRemoveSelected = () => {
        edit(tracks.filter((_, i) => !selectedIndices.includes(i)));
        setSelectedIndices([]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // One request: remove every current entry and add the edited list, so a failure cannot empty the playlist.
            await navidromeApi.replacePlaylistTracks(playlist.id, serverTracks.length, tracks.map(track => track.id));
            setHasUnsavedChanges(false);
            toast.success(`Saved "${playlist.name}".`);
            void queryClient.invalidateQueries({ queryKey: ['playlist', playlist.id] });
            void queryClient.invalidateQueries({ queryKey: ['playlists'] });
        } catch (err) {
            toast.error(`Could not save playlist: ${describeError(err)}`);
        } finally {
            setSaving(false);
        }
    };

    const isEmptySpace = (e: React.DragEvent) =>
        e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('playlist-items');

    return (
        <div
            className={`playlist-view ${isDropZone ? 'drop-zone-active' : ''}`}
            onDragOver={(e) => {
                if (!isEmptySpace(e) || !isExternalDrag(e)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDropZone(true);
            }}
            onDragLeave={(e) => {
                if (e.target === e.currentTarget) setIsDropZone(false);
            }}
            onDrop={(e) => {
                if (!isEmptySpace(e)) return;
                e.preventDefault();
                setIsDropZone(false);
                void insertDropped(e, null);
            }}
        >
            <div className="playlist-header">
                <h3>{playlist.name} ({tracks.length})</h3>
                <div className="playlist-actions">
                    <button onClick={() => playQueue(tracks, 0)} disabled={tracks.length === 0} title="Play All">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    <button onClick={handleRemoveSelected} disabled={selectedIndices.length === 0} title="Remove Selected">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                    </button>
                    <button
                        onClick={() => void handleSave()}
                        disabled={!hasUnsavedChanges || saving}
                        title={hasUnsavedChanges ? 'Save changes' : 'No unsaved changes'}
                        className={hasUnsavedChanges ? 'unsaved' : undefined}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="playlist-items">
                {tracks.map((track, index) => {
                    const classes = [
                        'queue-item',
                        selectedIndices.includes(index) && 'selected',
                        draggedIndex === index && 'dragging',
                        dragOverIndex === index && 'drag-over',
                    ].filter(Boolean).join(' ');
                    return (
                        <div
                            key={`${track.id}-${index}`}
                            className={classes}
                            draggable
                            onClick={(e) => handleItemClick(index, e)}
                            onDragStart={(e) => {
                                setDraggedIndex(index);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', String(index));
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverIndex(index);
                                const external = isExternalDrag(e);
                                e.dataTransfer.dropEffect = external ? 'copy' : 'move';
                                if (external) setIsDropZone(true);
                            }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={() => {
                                setDraggedIndex(null);
                                setDragOverIndex(null);
                            }}
                        >
                            <div className="drag-handle">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="9" cy="5" r="2" />
                                    <circle cx="9" cy="12" r="2" />
                                    <circle cx="9" cy="19" r="2" />
                                    <circle cx="15" cy="5" r="2" />
                                    <circle cx="15" cy="12" r="2" />
                                    <circle cx="15" cy="19" r="2" />
                                </svg>
                            </div>
                            <div className="song-info">
                                <div className="title">{track.title}</div>
                                <div className="artist">{track.artist}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
