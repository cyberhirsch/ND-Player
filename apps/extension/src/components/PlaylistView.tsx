import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi } from '../api/navidrome';
import { usePlayerStore } from '../store/usePlayerStore';

interface PlaylistViewProps {
    playlistId: string;
}

export default function PlaylistView({ playlistId }: PlaylistViewProps) {
    const { actions } = usePlayerStore();
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDropZone, setIsDropZone] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [localTracks, setLocalTracks] = useState<any[]>([]);

    const { data: playlist, isLoading, error, refetch } = useQuery({
        queryKey: ['playlist', playlistId],
        queryFn: () => navidromeApi.getPlaylist(playlistId),
        enabled: !!playlistId,
    });

    // Update local tracks when playlist data changes
    useEffect(() => {
        if (playlist?.entry) {
            setLocalTracks(playlist.entry);
            setHasUnsavedChanges(false);
        }
    }, [playlist]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIndex(index);

        // Check if it's an external drag
        const hasJson = e.dataTransfer.types.includes('application/json');
        if (hasJson) {
            e.dataTransfer.dropEffect = 'copy';
            setIsDropZone(true);
        } else {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIndex(null);
        setIsDropZone(false);

        const plainText = e.dataTransfer.getData('text/plain');
        const jsonData = e.dataTransfer.getData('application/json');

        if (plainText && !jsonData) {
            // Internal reorder
            const fromIndex = parseInt(plainText);
            if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                const newTracks = [...localTracks];
                const [movedTrack] = newTracks.splice(fromIndex, 1);
                newTracks.splice(toIndex, 0, movedTrack);
                setLocalTracks(newTracks);
                setHasUnsavedChanges(true);
            }
        } else if (jsonData) {
            // External drop - add songs/albums to playlist
            try {
                const data = JSON.parse(jsonData);

                if (data.type === 'song') {
                    // Insert single song at drop position
                    const newTracks = [...localTracks];
                    newTracks.splice(toIndex, 0, data.song);
                    setLocalTracks(newTracks);
                    setHasUnsavedChanges(true);
                } else if (data.type === 'album') {
                    // Fetch album and insert all songs at drop position
                    const album = await navidromeApi.getAlbum(data.id);
                    if (album?.song) {
                        const newTracks = [...localTracks];
                        newTracks.splice(toIndex, 0, ...album.song);
                        setLocalTracks(newTracks);
                        setHasUnsavedChanges(true);
                    }
                }
            } catch (error) {
                console.error('Failed to handle drop:', error);
            }
        }

        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('playlist-items')) {
            e.preventDefault();
            const hasJson = e.dataTransfer.types.includes('application/json');
            if (hasJson) {
                e.dataTransfer.dropEffect = 'copy';
                setIsDropZone(true);
            }
        }
    };

    const handleContainerDrop = async (e: React.DragEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('playlist-items')) {
            e.preventDefault();
            setIsDropZone(false);

            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));

                if (data.type === 'song') {
                    setLocalTracks([...localTracks, data.song]);
                    setHasUnsavedChanges(true);
                } else if (data.type === 'album') {
                    const album = await navidromeApi.getAlbum(data.id);
                    if (album?.song) {
                        setLocalTracks([...localTracks, ...album.song]);
                        setHasUnsavedChanges(true);
                    }
                }
            } catch (error) {
                console.error('Failed to handle drop:', error);
            }
        }
    };

    const handleContainerDragLeave = (e: React.DragEvent) => {
        if (e.target === e.currentTarget) {
            setIsDropZone(false);
        }
    };

    const handleItemClick = (index: number, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedIndices(prev =>
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            );
        } else if (e.shiftKey && selectedIndices.length > 0) {
            const lastSelected = selectedIndices[selectedIndices.length - 1];
            const start = Math.min(lastSelected, index);
            const end = Math.max(lastSelected, index);
            const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            setSelectedIndices(range);
        } else {
            setSelectedIndices([index]);

            // Play the song (replace queue with playlist)
            actions.clearQueue();
            actions.addToQueue(localTracks);
            if (localTracks[index]) {
                actions.play(localTracks[index]);
            }
        }
    };

    const handleRemoveSelected = () => {
        const newTracks = localTracks.filter((_, i) => !selectedIndices.includes(i));
        setLocalTracks(newTracks);
        setSelectedIndices([]);
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        try {
            // Remove all tracks from playlist
            const indicesToRemove = playlist?.entry?.map((_: any, i: number) => i) || [];
            if (indicesToRemove.length > 0) {
                await navidromeApi.removeFromPlaylist(playlistId, indicesToRemove);
            }

            // Add all tracks back in new order
            const songIds = localTracks.map((track: any) => track.id);
            if (songIds.length > 0) {
                await navidromeApi.addToPlaylist(playlistId, songIds);
            }

            setHasUnsavedChanges(false);
            refetch();
        } catch (error) {
            console.error('Failed to save playlist:', error);
        }
    };

    const handlePlayAll = () => {
        actions.clearQueue();
        localTracks.forEach((track: any) => actions.addToQueue(track));
        if (localTracks.length > 0) {
            actions.play(localTracks[0]);
        }
    };

    if (isLoading) return <div>Loading playlist...</div>;
    if (error) return <div>Error loading playlist</div>;
    if (!playlist) return <div>Playlist not found</div>;

    return (
        <div
            className={`playlist-view ${isDropZone ? 'drop-zone-active' : ''}`}
            onDragOver={handleContainerDragOver}
            onDragLeave={handleContainerDragLeave}
            onDrop={handleContainerDrop}
        >
            <div className="playlist-header">
                <h3>{playlist.name} ({localTracks.length})</h3>
                <div className="playlist-actions">
                    <button onClick={handlePlayAll} title="Play All">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleRemoveSelected}
                        disabled={selectedIndices.length === 0}
                        title="Remove Selected"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges}
                        title="Save Playlist"
                        style={{
                            background: hasUnsavedChanges ? 'var(--accent-color)' : undefined,
                            color: hasUnsavedChanges ? '#fff' : undefined
                        }}
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
                {localTracks.map((track: any, index: number) => {
                    const isSelected = selectedIndices.includes(index);
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                        <div
                            key={`${track.id}-${index}`}
                            className={`queue-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                            draggable
                            onClick={(e) => handleItemClick(index, e)}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
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
