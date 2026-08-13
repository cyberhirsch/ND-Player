import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi } from '../api/navidrome';

interface PlaylistSelectorProps {
    onSelectPlaylist: (playlistId: string | null) => void;
    selectedPlaylistId: string | null;
}

export default function PlaylistSelector({ onSelectPlaylist, selectedPlaylistId }: PlaylistSelectorProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const { data: playlists, refetch } = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    const handleCreate = async () => {
        if (!newPlaylistName.trim()) return;

        try {
            await navidromeApi.createPlaylist(newPlaylistName);
            setNewPlaylistName('');
            setShowCreateDialog(false);
            refetch();
        } catch (error) {
            console.error('Failed to create playlist:', error);
        }
    };

    return (
        <div className="playlist-selector">
            <select
                value={selectedPlaylistId || 'queue'}
                onChange={(e) => onSelectPlaylist(e.target.value === 'queue' ? null : e.target.value)}
                className="playlist-dropdown"
            >
                <option value="queue">Queue</option>
                <optgroup label="Playlists">
                    {playlists?.map((playlist: any) => (
                        <option key={playlist.id} value={playlist.id}>
                            {playlist.name}
                        </option>
                    ))}
                </optgroup>
            </select>
            <button
                className="create-playlist-btn"
                onClick={() => setShowCreateDialog(true)}
                title="Create new playlist"
            >
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
                            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={handleCreate}>Create</button>
                            <button onClick={() => setShowCreateDialog(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
