import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import QueueControls from './QueueControls';
import PlaylistSelector from './PlaylistSelector';
import PlaylistView from './PlaylistView';
import './QueueList.css';

export default function QueueList() {
    const { queue, actions, currentSong } = usePlayerStore();
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [isDropZone, setIsDropZone] = useState(false);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleItemClick = (index: number, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            // Multi-select with Ctrl/Cmd
            setSelectedIndices(prev =>
                prev.includes(index)
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
            );
        } else if (e.shiftKey && selectedIndices.length > 0) {
            // Range select with Shift
            const lastSelected = selectedIndices[selectedIndices.length - 1];
            const start = Math.min(lastSelected, index);
            const end = Math.max(lastSelected, index);
            const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            setSelectedIndices(range);
        } else {
            // Single select AND play
            setSelectedIndices([index]);
            actions.play(queue[index]);
        }
    };

    const handleClearSelection = () => {
        setSelectedIndices([]);
    };

    const handleItemDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent container handler from firing
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

    const handleItemDrop = async (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIndex(null);
        setIsDropZone(false);

        // Check if it's an internal reorder or external drop
        const plainText = e.dataTransfer.getData('text/plain');
        const jsonData = e.dataTransfer.getData('application/json');

        if (plainText && !jsonData) {
            // Internal reorder
            const fromIndex = parseInt(plainText);
            if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                actions.reorderQueue(fromIndex, toIndex);
            }
        } else if (jsonData) {
            // External drop
            try {
                const data = JSON.parse(jsonData);

                if (data.type === 'song') {
                    // Insert single song at drop position
                    actions.insertAtIndex([data.song], toIndex);
                } else if (data.type === 'album') {
                    // Fetch album details and insert all songs at drop position
                    const { navidromeApi } = await import('../api/navidrome');
                    const album = await navidromeApi.getAlbum(data.id);
                    if (album?.song) {
                        actions.insertAtIndex(album.song, toIndex);
                    }
                }
            } catch (error) {
                console.error('Failed to handle drop:', error);
            }
        }

        setDraggedIndex(null);
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        // Only handle if dragging over empty space (not over an item)
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('queue-items')) {
            e.preventDefault();
            const hasJson = e.dataTransfer.types.includes('application/json');
            if (hasJson) {
                e.dataTransfer.dropEffect = 'copy';
                setIsDropZone(true);
            }
        }
    };

    const handleContainerDrop = async (e: React.DragEvent) => {
        // Only handle if dropped on empty space
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('queue-items')) {
            e.preventDefault();
            setIsDropZone(false);

            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));

                if (data.type === 'song') {
                    actions.addToQueue(data.song);
                } else if (data.type === 'album') {
                    const { navidromeApi } = await import('../api/navidrome');
                    const album = await navidromeApi.getAlbum(data.id);
                    if (album?.song) {
                        album.song.forEach((song: any) => actions.addToQueue(song));
                    }
                }
            } catch (error) {
                console.error('Failed to handle drop:', error);
            }
        }
    };

    const handleContainerDragLeave = (e: React.DragEvent) => {
        // Only clear if leaving the container entirely
        if (e.target === e.currentTarget) {
            setIsDropZone(false);
        }
    };

    // If a playlist is selected, show the playlist view
    if (selectedPlaylistId) {
        return (
            <div className="queue-list">
                <PlaylistSelector
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={setSelectedPlaylistId}
                />
                <PlaylistView playlistId={selectedPlaylistId} />
            </div>
        );
    }

    // Otherwise show the queue
    return (
        <div
            className={`queue-list ${isDropZone ? 'drop-zone-active' : ''}`}
            onDragOver={handleContainerDragOver}
            onDragLeave={handleContainerDragLeave}
            onDrop={handleContainerDrop}
        >
            <PlaylistSelector
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={setSelectedPlaylistId}
            />
            <div className="queue-header">
                <h3>Queue ({queue.length})</h3>
                <QueueControls
                    selectedIndices={selectedIndices}
                    onClearSelection={handleClearSelection}
                />
            </div>
            {queue.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>
                    No songs in queue
                </div>
            ) : (
                <div className="queue-items">
                    {queue.map((song, index) => {
                        const isActive = currentSong?.id === song.id;
                        const isSelected = selectedIndices.includes(index);
                        const isDragging = draggedIndex === index;
                        const isDragOver = dragOverIndex === index;

                        return (
                            <div
                                key={`${song.id}-${index}`}
                                className={`queue-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                draggable
                                onClick={(e) => handleItemClick(index, e)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleItemDragOver(e, index)}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDrop={(e) => handleItemDrop(e, index)}
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
                                    <div className="title">{song.title}</div>
                                    <div className="artist">{song.artist}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
