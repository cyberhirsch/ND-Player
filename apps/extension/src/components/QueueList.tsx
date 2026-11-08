import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '../store/usePlayerStore';
import { isExternalDrag, songsFromDrop } from '../lib/drop';
import { describeError } from '../api/navidrome';
import { toast } from '../store/useToastStore';
import QueueControls from './QueueControls';
import PlaylistSelector from './PlaylistSelector';
import PlaylistView from './PlaylistView';
import './QueueList.css';

export default function QueueList() {
    const { queue, currentQid } = usePlayerStore(useShallow(state => ({ queue: state.queue, currentQid: state.currentQid })));
    const actions = usePlayerStore(state => state.actions);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [isDropZone, setIsDropZone] = useState(false);

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
            actions.playAt(index);
        }
    };

    const insertDropped = async (e: React.DragEvent, index: number | null) => {
        try {
            const songs = await songsFromDrop(e);
            if (songs.length === 0) return;
            if (index === null) actions.addToQueue(songs);
            else actions.insertAtIndex(songs, index);
        } catch (error) {
            toast.error(`Could not add to queue: ${describeError(error)}`);
        }
    };

    const handleItemDrop = (e: React.DragEvent, toIndex: number) => {
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
            actions.reorderQueue(fromIndex, toIndex);
            setSelectedIndices([]);
        }
    };

    const isEmptySpace = (e: React.DragEvent) =>
        e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('queue-items');

    if (selectedPlaylistId) {
        return (
            <div className="queue-list">
                <PlaylistSelector selectedPlaylistId={selectedPlaylistId} onSelectPlaylist={setSelectedPlaylistId} />
                <PlaylistView playlistId={selectedPlaylistId} />
            </div>
        );
    }

    return (
        <div
            className={`queue-list ${isDropZone ? 'drop-zone-active' : ''}`}
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
            <PlaylistSelector selectedPlaylistId={selectedPlaylistId} onSelectPlaylist={setSelectedPlaylistId} />
            <div className="queue-header">
                <h3>Queue ({queue.length})</h3>
                <QueueControls selectedIndices={selectedIndices} onClearSelection={() => setSelectedIndices([])} />
            </div>
            {queue.length === 0 ? (
                <div className="queue-empty">No songs in queue</div>
            ) : (
                <div className="queue-items">
                    {queue.map((song, index) => {
                        const classes = [
                            'queue-item',
                            song.qid === currentQid && 'active',
                            selectedIndices.includes(index) && 'selected',
                            draggedIndex === index && 'dragging',
                            dragOverIndex === index && 'drag-over',
                        ].filter(Boolean).join(' ');

                        return (
                            <div
                                key={song.qid}
                                className={classes}
                                draggable
                                onClick={(e) => handleItemClick(index, e)}
                                onDragStart={(e) => {
                                    setDraggedIndex(index);
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', String(index));
                                }}
                                onDragEnd={() => {
                                    setDraggedIndex(null);
                                    setDragOverIndex(null);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverIndex(index);
                                    const external = isExternalDrag(e);
                                    e.dataTransfer.dropEffect = external ? 'copy' : 'move';
                                    if (external) setIsDropZone(true);
                                }}
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
