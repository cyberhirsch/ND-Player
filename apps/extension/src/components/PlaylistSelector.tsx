import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { describeError, navidromeApi } from '../api/navidrome';
import { toast } from '../store/useToastStore';

interface PlaylistSelectorProps {
    onSelectPlaylist: (playlistId: string | null) => void;
    selectedPlaylistId: string | null;
}

export default function PlaylistSelector({ onSelectPlaylist, selectedPlaylistId }: PlaylistSelectorProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const queryClient = useQueryClient();

    const { data: playlists = [] } = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    const handleCreate = async () => {
        const name = newPlaylistName.trim();
        if (!name) return;
        try {
            const playlist = await navidromeApi.createPlaylist(name);
            setNewPlaylistName('');
            setShowCreateDialog(false);
            await queryClient.invalidateQueries({ queryKey: ['playlists'] });
            if (playlist?.id) onSelectPlaylist(playlist.id);
            toast.success(`Created "${name}".`);
        } catch (error) {
            toast.error(`Could not create playlist: ${describeError(error)}`);
        }
    };

    return (
        <div className="playlist-selector">
            <select
                value={selectedPlaylistId || 'queue'}
                onChange={(e) => onSelectPlaylist(e.target.value === 'queue' ? null : e.target.value)}
                className="playlist-dropdown"
                aria-label="Show queue or playlist"
            >
                <option value="queue">Queue</option>
                <optgroup label="Playlists">
                    {playlists.map(playlist => (
                        <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                    ))}
                </optgroup>
            </select>
            <button className="create-playlist-btn" onClick={() => setShowCreateDialog(true)} title="Create new playlist">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>

            {showCreateDialog && (
                <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Create Playlist</h3>
                        <input
                            type="text"
                            placeholder="Playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleCreate();
                            }}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => void handleCreate()} disabled={!newPlaylistName.trim()}>Create</button>
                            <button onClick={() => setShowCreateDialog(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
