import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { navidromeApi } from '../api/navidrome';

interface QueueControlsProps {
    selectedIndices: number[];
    onClearSelection: () => void;
}

export default function QueueControls({ selectedIndices, onClearSelection }: QueueControlsProps) {
    const { actions, queue } = usePlayerStore();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [playlistName, setPlaylistName] = useState('');

    const handleShuffle = () => {
        actions.shuffleQueue();
        onClearSelection();
    };

    const handleClear = () => {
        actions.clearQueue();
        onClearSelection();
    };

    const handleMoveToTop = () => {
        if (selectedIndices.length === 0) return;
        actions.moveToTop(selectedIndices);
        onClearSelection();
    };

    const handleMoveToBottom = () => {
        if (selectedIndices.length === 0) return;
        actions.moveToBottom(selectedIndices);
        onClearSelection();
    };

    const handleRemove = () => {
        if (selectedIndices.length === 0) return;
        actions.removeFromQueue(selectedIndices);
        onClearSelection();
    };

    const handleSaveAsPlaylist = async () => {
        if (!playlistName.trim() || queue.length === 0) return;

        try {
            const playlist = await navidromeApi.createPlaylist(playlistName);
            const songIds = queue.map(song => song.id);
            await navidromeApi.addToPlaylist(playlist.id, songIds);
            setPlaylistName('');
            setShowSaveDialog(false);
        } catch (error) {
            console.error('Failed to save queue as playlist:', error);
        }
    };

    return (
        <>
            <div className="queue-controls">
                <button
                    className="control-btn"
                    onClick={handleShuffle}
                    title="Shuffle queue"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                    </svg>
                </button>
                <button
                    className="control-btn"
                    disabled={selectedIndices.length === 0}
                    onClick={handleMoveToTop}
                    title="Move to top"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                        <path d="M6 3h12" />
                    </svg>
                </button>
                <button
                    className="control-btn"
                    disabled={selectedIndices.length === 0}
                    onClick={handleMoveToBottom}
                    title="Move to bottom"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                        <path d="M6 21h12" />
                    </svg>
                </button>
                <button
                    className="control-btn"
                    disabled={selectedIndices.length === 0}
                    onClick={handleRemove}
                    title="Remove from queue"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                <button
                    className="control-btn"
                    onClick={handleClear}
                    title="Clear queue"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
                <button
                    className="control-btn"
                    disabled={queue.length === 0}
                    onClick={() => setShowSaveDialog(true)}
                    title="Save queue as playlist"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                </button>
            </div>

            {showSaveDialog && (
                <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Save Queue as Playlist</h3>
                        <input
                            type="text"
                            placeholder="Playlist name"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveAsPlaylist()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={handleSaveAsPlaylist}>Save</button>
                            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
