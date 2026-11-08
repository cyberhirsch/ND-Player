import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlayerStore } from '../store/usePlayerStore';
import { describeError, navidromeApi } from '../api/navidrome';
import { toast } from '../store/useToastStore';

interface QueueControlsProps {
    selectedIndices: number[];
    onClearSelection: () => void;
}

export default function QueueControls({ selectedIndices, onClearSelection }: QueueControlsProps) {
    const queueLength = usePlayerStore(state => state.queue.length);
    const actions = usePlayerStore(state => state.actions);
    const queryClient = useQueryClient();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [playlistName, setPlaylistName] = useState('');
    const [saving, setSaving] = useState(false);
    const nothingSelected = selectedIndices.length === 0;

    const withClear = (action: () => void) => () => {
        action();
        onClearSelection();
    };

    const handleSaveAsPlaylist = async () => {
        const name = playlistName.trim();
        const songIds = usePlayerStore.getState().queue.map(song => song.id);
        if (!name || songIds.length === 0) return;

        setSaving(true);
        try {
            await navidromeApi.createPlaylist(name, songIds);
            void queryClient.invalidateQueries({ queryKey: ['playlists'] });
            toast.success(`Saved the queue as "${name}".`);
            setPlaylistName('');
            setShowSaveDialog(false);
        } catch (error) {
            toast.error(`Could not save playlist: ${describeError(error)}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="queue-controls">
                <button className="control-btn" onClick={withClear(actions.shuffleQueue)} title="Shuffle queue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                    </svg>
                </button>
                <button className="control-btn" disabled={nothingSelected} onClick={withClear(() => actions.moveToTop(selectedIndices))} title="Move to top">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                        <path d="M6 3h12" />
                    </svg>
                </button>
                <button className="control-btn" disabled={nothingSelected} onClick={withClear(() => actions.moveToBottom(selectedIndices))} title="Move to bottom">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                        <path d="M6 21h12" />
                    </svg>
                </button>
                <button className="control-btn" disabled={nothingSelected} onClick={withClear(() => actions.removeFromQueue(selectedIndices))} title="Remove from queue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                <button className="control-btn" onClick={withClear(actions.clearQueue)} title="Clear queue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
                <button className="control-btn" disabled={queueLength === 0} onClick={() => setShowSaveDialog(true)} title="Save queue as playlist">
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleSaveAsPlaylist();
                            }}
                            autoFocus
                            disabled={saving}
                        />
                        <div className="modal-actions">
                            <button onClick={() => void handleSaveAsPlaylist()} disabled={saving || !playlistName.trim()}>Save</button>
                            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
